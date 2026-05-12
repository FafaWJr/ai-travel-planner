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

  const { data: trip, error: tripError } = await supabase
    .from('saved_trips')
    .select('id, destination, start_date, end_date, title, trip_data')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return Response.json({ error: 'Trip not found' }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from('trip_memories')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return Response.json({
      memory: existing,
      trip: {
        id: trip.id,
        destination: trip.destination,
        title: trip.title,
        start_date: trip.start_date,
        end_date: trip.end_date,
      },
    });
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

  const { data: updated, error } = await supabase
    .from('trip_memories')
    .update(updatePayload)
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[memories/PUT] update error:', error);
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
