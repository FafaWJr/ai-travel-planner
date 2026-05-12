import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

interface MemoryDay {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
  photos: unknown[];
}

/**
 * GET /api/memories/[tripId]
 * Returns the memory data for a trip. Creates the trip_memories row
 * if it does not exist, pre-populating days from the trip's itinerary.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the saved trip (for linked memories). Will be null for standalone.
  // H2: .eq('user_id') guards against IDOR — a user supplying someone else's trip UUID.
  const { data: trip } = await supabase
    .from('saved_trips')
    .select('id, destination, start_date, end_date, title, trip_data')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single();

  // Dual-lookup: try trip_id first (linked memories), then id (standalone memories)
  let existing = null;
  const { data: byTripId } = await supabase
    .from('trip_memories')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (byTripId) {
    existing = byTripId;
  } else {
    const { data: byId } = await supabase
      .from('trip_memories')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single();
    existing = byId;
  }

  if (!existing && !trip) {
    return Response.json({ error: 'Trip or memory not found' }, { status: 404 });
  }

  if (existing) {
    const memData = existing.memory_data as Record<string, unknown>;
    const tripMeta = existing.trip_id ? {
      id: trip?.id,
      destination: trip?.destination,
      title: trip?.title,
      start_date: trip?.start_date,
      end_date: trip?.end_date,
    } : {
      id: existing.id,
      destination: (memData?.tripDestination as string) ?? existing.standalone_destination,
      title: (memData?.tripTitle as string) ?? existing.standalone_destination,
      start_date: (memData?.tripStartDate as string) ?? existing.standalone_start_date,
      end_date: (memData?.tripEndDate as string) ?? existing.standalone_end_date,
    };

    return Response.json({
      memory: existing,
      trip: tripMeta,
    });
  }

  // At this point existing is null; trip is non-null (both-null case returned 404 above)
  if (!trip) {
    return Response.json({ error: 'Trip not found' }, { status: 404 });
  }

  const days = buildDaysFromTrip(trip);

  const { data: created, error: createError } = await supabase
    .from('trip_memories')
    .insert({
      trip_id: tripId,
      user_id: user.id,
      memory_data: {
        days,
        tripDestination: trip.destination,
        tripTitle: trip.title,
        tripStartDate: trip.start_date,
        tripEndDate: trip.end_date,
      },
    })
    .select()
    .single();

  if (createError) {
    console.error('[memories/GET] create error:', createError);
    return Response.json({ error: 'Failed to create memory' }, { status: 500 });
  }

  return Response.json({
    memory: created,
    trip: {
      id: trip.id,
      destination: trip.destination,
      title: trip.title,
      start_date: trip.start_date,
      end_date: trip.end_date,
    },
  });
}

/**
 * PUT /api/memories/[tripId]
 * Updates memory_data (notes, moods, highlights) for an existing memory.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { memory_data, status: memoryStatus, narrative } = body as {
    memory_data?: { days: MemoryDay[] };
    status?: 'draft' | 'complete';
    narrative?: string;
  };

  const updatePayload: Record<string, unknown> = {};
  if (memory_data) updatePayload.memory_data = memory_data;
  if (memoryStatus) updatePayload.status = memoryStatus;
  if (narrative !== undefined) updatePayload.narrative = narrative;

  if (Object.keys(updatePayload).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Dual-lookup: try trip_id first, then id (standalone memories)
  let updated = null;
  let updateError = null;

  const { data: byTripId, error: err1 } = await supabase
    .from('trip_memories')
    .update(updatePayload)
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (byTripId) {
    updated = byTripId;
  } else {
    const { data: byId, error: err2 } = await supabase
      .from('trip_memories')
      .update(updatePayload)
      .eq('id', tripId)
      .eq('user_id', user.id)
      .select()
      .single();
    updated = byId;
    updateError = err2 ?? err1;
  }

  if (!updated) {
    console.error('[memories/PUT] update error:', updateError);
    return Response.json({ error: 'Failed to update memory' }, { status: 500 });
  }

  return Response.json({ memory: updated });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDaysFromTrip(trip: {
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  trip_data: Record<string, unknown> | null;
}): MemoryDay[] {
  const tripData = trip.trip_data as {
    itineraryDays?: Array<{ number?: number; title?: string }>;
  } | null;

  const itineraryDays = tripData?.itineraryDays;

  if (itineraryDays && itineraryDays.length > 0) {
    return itineraryDays.map((day, i) => ({
      dayNumber: day.number ?? i + 1,
      dayTitle: day.title ?? `Day ${i + 1}`,
      notes: '',
      mood: null,
      highlight: false,
      photos: [],
    }));
  }

  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const numDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const dest = trip.destination ?? 'your trip';

    return Array.from({ length: Math.max(numDays, 1) }, (_, i) => ({
      dayNumber: i + 1,
      dayTitle: `Day ${i + 1} in ${dest}`,
      notes: '',
      mood: null,
      highlight: false,
      photos: [],
    }));
  }

  return [{
    dayNumber: 1,
    dayTitle: 'Day 1',
    notes: '',
    mood: null,
    highlight: false,
    photos: [],
  }];
}
