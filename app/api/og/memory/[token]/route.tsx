import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: memory } = await serviceSupabase
    .from('trip_memories')
    .select('memory_data, narrative')
    .eq('share_token', token)
    .eq('status', 'complete')
    .single();

  const destination =
    (memory?.memory_data as { tripDestination?: string; tripTitle?: string } | null)?.tripDestination ||
    (memory?.memory_data as { tripDestination?: string; tripTitle?: string } | null)?.tripTitle ||
    'A trip';

  const memData = memory?.memory_data as {
    tripStartDate?: string;
    tripEndDate?: string;
  } | null;

  const startDate = memData?.tripStartDate
    ? new Date(memData.tripStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const endDate = memData?.tripEndDate
    ? new Date(memData.tripEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const narrativeSnippet = memory?.narrative
    ? memory.narrative.slice(0, 200).trim() + (memory.narrative.length > 200 ? '...' : '')
    : null;

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
            top: -100,
            right: -100,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(255,130,16,0.18)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(255,189,89,0.1)',
            display: 'flex',
          }}
        />

        {/* Brand */}
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

        {/* Memory label */}
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
          Trip Memory
        </div>

        {/* Destination */}
        <div
          style={{
            color: 'white',
            fontSize: destination.length > 30 ? 48 : 64,
            fontWeight: 700,
            letterSpacing: '-2px',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.05,
            marginBottom: 20,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {destination}
        </div>

        {/* Dates */}
        {startDate && endDate && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 20,
              marginBottom: narrativeSnippet ? 24 : 0,
            }}
          >
            <span style={{ display: 'flex' }}>{startDate} &mdash; {endDate}</span>
          </div>
        )}

        {/* Narrative snippet */}
        {narrativeSnippet && (
          <div
            style={{
              maxWidth: 800,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 17,
              lineHeight: 1.6,
              fontStyle: 'italic',
              padding: '0 40px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            &ldquo;{narrativeSnippet}&rdquo;
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
          <span style={{ display: 'flex' }}>Written with Luna &bull; lunaletsgo.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );
}
