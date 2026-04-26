import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { injectMissingDayIds, type TripData } from '@/lib/trip-ids'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/* ── GET /api/trips  — list all trips for the authenticated user ── */
export async function GET() {
  const supabase = await makeSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('saved_trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/trips] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trips: data })
}

/* ── POST /api/trips  — create a new saved trip ── */
export async function POST(request: NextRequest) {
  const supabase = await makeSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, destination, start_date, end_date, trip_data, chat_history } = body

  // Stage 2c: server-side UUID injection. Every day gets a stable id
  // before trip_data crosses the DB boundary, so Stage 2d patches and
  // Stage 4 comments-on-day have a consistent key. Idempotent: days
  // that already have an id are untouched.
  const safeTripData = trip_data
    ? injectMissingDayIds(trip_data as TripData)
    : trip_data

  // Guarantee the profiles row exists — saved_trips.user_id has FK → profiles.id
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'id' }
  )

  const { data, error } = await supabase
    .from('saved_trips')
    .insert({
      user_id: user.id,
      title,
      destination: destination ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      trip_data: safeTripData,
      chat_history: chat_history ?? [],
      is_favorite: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[POST /api/trips] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: (data as { id: string }).id }, { status: 201 })
}

/* ── PATCH /api/trips  — update an existing saved trip ── */
export async function PATCH(request: NextRequest) {
  const supabase = await makeSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, title, trip_data, chat_history } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing trip id' }, { status: 400 })
  }

  // ── Destructive-PATCH guard (plan-ssr-fix, 2026-04-27) ──────────────────
  // Defense-in-depth: refuse any PATCH that would replace a non-empty
  // plan/photos with an empty value. Triggered when a layout-level autosave
  // fires while PlanContent never mounted, sending `plan: ''` and `photos: []`
  // and silently corrupting saved trips.
  //
  // The guard is intentionally scoped:
  //   - ONLY fires when the incoming trip_data EXPLICITLY contains the
  //     `plan` (or `photos`) key with an empty value. A collab save (which
  //     writes only `itineraryDays/Phases/hotels` and omits `plan/photos`)
  //     is NOT affected.
  //   - Compares against the current row's stored value, fetched with the
  //     same RLS-scoped client used for the update below.
  //
  // To genuinely clear a plan in the future, send an explicit
  // `trip_data.allowEmpty: true` flag and extend this guard accordingly.
  if (trip_data !== undefined && trip_data !== null && typeof trip_data === 'object') {
    const incoming = trip_data as Record<string, unknown>
    const hasPlanKey = 'plan' in incoming
    const hasPhotosKey = 'photos' in incoming
    const incomingPlan = hasPlanKey ? String(incoming.plan ?? '') : null
    const incomingPhotos = hasPhotosKey && Array.isArray(incoming.photos) ? incoming.photos : null

    if (hasPlanKey || hasPhotosKey) {
      const { data: current, error: currentErr } = await supabase
        .from('saved_trips')
        .select('trip_data')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (currentErr) {
        console.error('[PATCH /api/trips] guard: current-row fetch failed:', currentErr)
        return NextResponse.json({ error: currentErr.message }, { status: 500 })
      }

      const currentTd = (current?.trip_data ?? null) as Record<string, unknown> | null
      const currentPlan = typeof currentTd?.plan === 'string' ? currentTd.plan : ''
      const currentPhotos = Array.isArray(currentTd?.photos) ? (currentTd.photos as unknown[]) : []

      const isDestructivePlan = hasPlanKey && currentPlan.length > 0 && (incomingPlan ?? '').length === 0
      const isDestructivePhotos = hasPhotosKey && currentPhotos.length > 0 && (incomingPhotos?.length ?? 0) === 0

      if (isDestructivePlan || isDestructivePhotos) {
        console.error('[PATCH /api/trips] REFUSED_DESTRUCTIVE_PATCH', {
          tripId: id,
          userId: user.id,
          currentPlanLen: currentPlan.length,
          incomingPlanLen: incomingPlan?.length ?? null,
          currentPhotosCount: currentPhotos.length,
          incomingPhotosCount: incomingPhotos?.length ?? null,
        })
        return NextResponse.json(
          {
            error: 'REFUSED_DESTRUCTIVE_PATCH',
            reason: 'Refusing to overwrite non-empty plan or photos with empty values',
            currentPlanLen: currentPlan.length,
            incomingPlanLen: incomingPlan?.length ?? null,
          },
          { status: 400 }
        )
      }
    }
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updatePayload.title = title
  if (trip_data !== undefined) {
    // Stage 2c: server-side UUID injection (idempotent). See POST handler.
    updatePayload.trip_data = injectMissingDayIds(trip_data as TripData)
  }
  if (chat_history !== undefined) updatePayload.chat_history = chat_history

  const { error } = await supabase
    .from('saved_trips')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[PATCH /api/trips] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/* ── DELETE /api/trips?id=  — remove a saved trip ── */
export async function DELETE(request: NextRequest) {
  const supabase = await makeSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing trip id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('saved_trips')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[DELETE /api/trips] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
