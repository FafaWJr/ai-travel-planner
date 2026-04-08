import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
      trip_data,
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

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updatePayload.title = title
  if (trip_data !== undefined) updatePayload.trip_data = trip_data
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
