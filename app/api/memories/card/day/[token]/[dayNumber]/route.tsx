import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; dayNumber: string }> },
) {
  const { token, dayNumber: dayNumStr } = await params;
  const dayNum = parseInt(dayNumStr, 10);

  let destination = 'A trip';
  let dayTitle = `Day ${dayNum}`;
  let daySummary = '';

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
        days?: Array<{ dayNumber: number; dayTitle: string }>;
      };

      destination = md.tripDestination ?? md.tripTitle ?? destination;
      const day = md.days?.find(d => d.dayNumber === dayNum);
      if (day) dayTitle = day.dayTitle;

      if (memory.narrative) {
        const paragraphs = memory.narrative.split('\n\n');
        const dayPara = paragraphs.find((p: string) =>
          p.toLowerCase().includes(dayTitle.toLowerCase().slice(0, 15)) ||
          p.includes(`Day ${dayNum}`) ||
          p.includes(`day ${dayNum}`),
        );
        if (dayPara) {
          const firstSentence = dayPara.split(/[.!?]/)[0]?.trim();
          daySummary = firstSentence
            ? firstSentence.length > 100
              ? firstSentence.slice(0, 97) + '...'
              : firstSentence
            : '';
        }
      }
    }
  } catch (err) {
    console.error('[card/day] data fetch error:', err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080, height: 1350,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(160deg, #FDFBF7 0%, #F4F0E8 100%)',
          padding: '80px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Day badge */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FF8210', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, flexShrink: 0,
          marginBottom: 32,
        }}>
          <span style={{ display: 'flex' }}>{dayNum}</span>
        </div>

        {/* Day title */}
        <div style={{
          fontSize: 48, fontWeight: 700, color: '#00447B',
          lineHeight: 1.2,
          display: 'flex', flexWrap: 'wrap',
          marginBottom: 16,
        }}>
          {dayTitle}
        </div>

        {/* Destination subtitle */}
        <div style={{ fontSize: 22, color: '#6C6D6F', display: 'flex', marginBottom: 48 }}>
          {destination}
        </div>

        {/* Day summary */}
        {daySummary && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{
              fontSize: 32, color: '#2a2a3e',
              lineHeight: 1.6, fontStyle: 'italic',
              borderLeft: '4px solid #FF8210',
              paddingLeft: 28, display: 'flex',
            }}>
              {daySummary}
            </div>
          </div>
        )}

        {/* Spacer when no summary */}
        {!daySummary && <div style={{ flex: 1, display: 'flex' }} />}

        {/* Luna branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#00447B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 700,
          }}>
            <span style={{ display: 'flex' }}>L</span>
          </div>
          <span style={{ fontSize: 18, color: '#C0C0C0', fontWeight: 500, display: 'flex' }}>
            Luna Let&apos;s Go
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );
}
