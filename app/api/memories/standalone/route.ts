import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { destination, startDate, endDate, travellers } = await request.json() as {
      destination: string;
      startDate: string;
      endDate: string;
      travellers?: string;
    };

    if (!destination || !startDate || !endDate) {
      return Response.json(
        { error: 'destination, startDate, and endDate are required' },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    const days = Array.from({ length: Math.max(numDays, 1) }, (_, i) => ({
      dayNumber: i + 1,
      dayTitle: '',
      dayTitleSource: 'placeholder',
      notes: '',
      mood: [],
      highlight: false,
      photos: [],
      locations: [],
      confidence: 'none',
    }));

    const { data: memory, error } = await supabase
      .from('trip_memories')
      .insert({
        user_id: user.id,
        trip_id: null,
        is_standalone: true,
        standalone_destination: destination,
        standalone_start_date: startDate,
        standalone_end_date: endDate,
        standalone_travellers: travellers ?? null,
        memory_data: {
          days,
          tripDestination: destination,
          tripTitle: destination,
          tripStartDate: startDate,
          tripEndDate: endDate,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[standalone] create error:', error);
      return Response.json({ error: 'Failed to create memory' }, { status: 500 });
    }

    return Response.json({ memory });
  } catch (err) {
    console.error('[standalone] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
