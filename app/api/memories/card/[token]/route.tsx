import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let destination = 'A trip to remember';
  let dateRange = '';
  let pullQuote = '';
  let dayCount = 0;

  try {
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

    if (memory) {
      const md = memory.memory_data as {
        tripDestination?: string;
        tripTitle?: string;
        tripStartDate?: string;
        tripEndDate?: string;
        days?: Array<{ dayNumber: number }>;
      };

      destination = md.tripDestination ?? md.tripTitle ?? destination;
      dayCount = md.days?.length ?? 0;

      if (md.tripStartDate) {
        const start = new Date(md.tripStartDate);
        const end = md.tripEndDate ? new Date(md.tripEndDate) : null;
        dateRange = start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        if (end && end.getMonth() !== start.getMonth()) {
          dateRange += ` - ${end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
        }
      }

      if (memory.narrative) {
        const firstSentence = memory.narrative.split(/[.!?]/)[0]?.trim();
        pullQuote = firstSentence
          ? firstSentence.length > 120
            ? firstSentence.slice(0, 117) + '...'
            : firstSentence
          : '';
      }
    }
  } catch (err) {
    console.error('[card] data fetch error:', err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080, height: 1920,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #001F3F 0%, #00447B 40%, #003060 100%)',
          padding: '120px 72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Luna branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#FF8210',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 700,
          }}>
            <span style={{ display: 'flex' }}>L</span>
          </div>
          <span style={{
            color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: 500, display: 'flex',
          }}>
            Luna Let&apos;s Go
          </span>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', paddingTop: 60,
        }}>
          {/* Trip Memory badge */}
          <div style={{ display: 'flex', marginBottom: 24 }}>
            <div style={{
              background: 'rgba(255,130,16,0.2)',
              border: '1px solid rgba(255,130,16,0.4)',
              borderRadius: 100, padding: '8px 20px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{
                color: '#FFBD59', fontSize: 14, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex',
              }}>
                Trip Memory
              </span>
            </div>
          </div>

          {/* Destination */}
          <div style={{
            fontSize: destination.length > 25 ? 56 : 72,
            fontWeight: 800, color: '#FFFFFF',
            lineHeight: 1.1,
            display: 'flex', flexWrap: 'wrap',
            marginBottom: 20,
          }}>
            {destination}
          </div>

          {/* Date range + day count */}
          {dateRange && (
            <div style={{
              fontSize: 24, color: 'rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8,
            }}>
              <span style={{ display: 'flex' }}>
                {dateRange}
                {dayCount > 0 ? ` · ${dayCount} ${dayCount === 1 ? 'day' : 'days'}` : ''}
              </span>
            </div>
          )}

          {/* Pull quote */}
          {pullQuote && (
            <div style={{
              marginTop: 48,
              borderLeft: '4px solid #FF8210',
              paddingLeft: 24,
              display: 'flex',
            }}>
              <span style={{
                fontSize: 28, color: 'rgba(255,255,255,0.7)',
                fontStyle: 'italic', lineHeight: 1.5, display: 'flex',
              }}>
                &ldquo;{pullQuote}&rdquo;
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 18, color: '#FF8210', fontWeight: 600, display: 'flex' }}>
            Read the full story
          </span>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
            lunaletsgo.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );
}
