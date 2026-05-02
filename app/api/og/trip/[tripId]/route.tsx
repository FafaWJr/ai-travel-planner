import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: trip } = await serviceSupabase
    .from('saved_trips')
    .select('destination, start_date, end_date, trip_data')
    .eq('id', tripId)
    .single();

  const destination = trip?.destination ?? 'Your trip';
  const startDate = trip?.start_date
    ? new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const endDate = trip?.end_date
    ? new Date(trip.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const dayCount: number = trip?.trip_data?.itineraryDays?.length ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#00447B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent circles */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,130,16,0.15)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,189,89,0.1)',
            display: 'flex',
          }}
        />

        {/* Luna Let's Go brand */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#FF8210',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: 'white', fontSize: 18, fontWeight: 700, display: 'flex' }}>L</div>
          </div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', display: 'flex' }}>
            Luna Let&apos;s Go
          </div>
        </div>

        {/* Trip label */}
        <div
          style={{
            background: 'rgba(255,130,16,0.2)',
            border: '1px solid rgba(255,130,16,0.5)',
            borderRadius: 24,
            padding: '8px 20px',
            color: '#FFBD59',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
            display: 'flex',
          }}
        >
          Trip Itinerary
        </div>

        {/* Destination */}
        <div
          style={{
            color: 'white',
            fontSize: destination.length > 30 ? 52 : 68,
            fontWeight: 700,
            letterSpacing: '-2px',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.05,
            marginBottom: 24,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {destination}
        </div>

        {/* Dates + day count */}
        {(startDate || dayCount > 0) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 22,
            }}
          >
            {startDate && endDate && (
              <span style={{ display: 'flex' }}>{startDate} &mdash; {endDate}</span>
            )}
            {startDate && endDate && dayCount > 0 && (
              <span style={{ display: 'flex', color: 'rgba(255,255,255,0.35)' }}>|</span>
            )}
            {dayCount > 0 && (
              <span style={{ display: 'flex' }}>{dayCount} {dayCount === 1 ? 'day' : 'days'}</span>
            )}
          </div>
        )}

        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(255,255,255,0.4)',
            fontSize: 15,
          }}
        >
          <span style={{ display: 'flex' }}>Planned with Luna &bull; lunaletsgo.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
