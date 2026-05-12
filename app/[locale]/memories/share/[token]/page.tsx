'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import NavBar from '@/components/NavBar';
import { BookHeart, MapPin } from 'lucide-react';
import type { PhotoMeta } from '@/lib/memories/types';

const RouteMap = nextDynamic(() => import('@/components/memories/RouteMap'), {
  ssr: false,
  loading: () => null,
});

interface MemoryDay {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
  photos: PhotoMeta[];
}

interface SharedMemory {
  id: string;
  trip_id: string;
  narrative: string | null;
  status: string;
  share_token: string;
  memory_data: {
    days?: MemoryDay[];
    tripDestination?: string | null;
    tripTitle?: string | null;
    tripStartDate?: string | null;
    tripEndDate?: string | null;
  };
  created_at: string;
}

export default function MemorySharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [memory, setMemory] = useState<SharedMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/memories/share/${token}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMemory(data.memory);
      } catch {
        setError('This memory is not available. It may not exist or has not been published yet.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const destination =
    memory?.memory_data?.tripDestination ||
    memory?.memory_data?.tripTitle ||
    'A trip';

  const startDate = memory?.memory_data?.tripStartDate
    ? new Date(memory.memory_data.tripStartDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;
  const endDate = memory?.memory_data?.tripEndDate
    ? new Date(memory.memory_data.tripEndDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const memoryDays = memory?.memory_data?.days ?? [];
  const hasPhotos = memoryDays.some(d => (d.photos?.length ?? 0) > 0);
  const getPhotoUrl = (photo: PhotoMeta) =>
    `${supabaseUrl}/storage/v1/object/public/memory-photos/${photo.storagePath}`;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FB' }}>
        <NavBar />
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.12)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F7FB' }}>
        <NavBar />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <BookHeart size={40} color="#C0C0C0" style={{ marginBottom: 16 }} />
          <p style={{ fontFamily: "'Inter',sans-serif", color: '#6C6D6F', fontSize: 16, lineHeight: 1.6 }}>
            {error || 'Memory not found.'}
          </p>
          <Link href="/" style={{
            display: 'inline-block', marginTop: 24,
            padding: '12px 24px', borderRadius: 10,
            background: '#FF8210', color: '#fff',
            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
            textDecoration: 'none',
          }}>
            Plan your own trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />

      {/* Navy hero header */}
      <div style={{
        background: '#00447B',
        padding: '96px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,130,16,0.15)',
          border: '1px solid rgba(255,130,16,0.4)',
          borderRadius: 100, padding: '6px 16px',
          marginBottom: 20,
        }}>
          <BookHeart size={14} color="#FFBD59" />
          <span style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
            color: '#FFBD59', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Trip Memory
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Poppins',sans-serif", fontWeight: 700,
          fontSize: destination.length > 30 ? 32 : 42,
          color: '#fff', margin: '0 0 12px',
          maxWidth: 700, marginLeft: 'auto', marginRight: 'auto',
          lineHeight: 1.15,
        }}>
          {destination}
        </h1>

        {(startDate || endDate) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <MapPin size={14} color="rgba(255,255,255,0.5)" />
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: 15,
              color: 'rgba(255,255,255,0.6)', margin: 0,
            }}>
              {startDate}
              {startDate && endDate ? ' → ' : ''}
              {endDate}
            </p>
          </div>
        )}
      </div>

      {/* Narrative content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        {memory.narrative ? (
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1.5px solid rgba(0,68,123,0.08)',
            boxShadow: '0 4px 24px rgba(0,68,123,0.06)',
            padding: '40px 40px',
          }}>
            <div style={{
              fontFamily: "'Inter',sans-serif", fontSize: 16, color: '#2a2a3e',
              lineHeight: 1.9, whiteSpace: 'pre-wrap',
            }}>
              {memory.narrative}
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#C0C0C0', fontFamily: "'Inter',sans-serif" }}>
            No story written yet.
          </p>
        )}

        {/* Route map */}
        {hasPhotos && (
          <div style={{ marginTop: 32 }}>
            <p style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
              color: '#00447B', margin: '0 0 8px', textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Your route
            </p>
            <RouteMap days={memoryDays} height={240} />
          </div>
        )}

        {/* Photo gallery by day */}
        {hasPhotos && (
          <div style={{ marginTop: 32 }}>
            <p style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
              color: '#00447B', margin: '0 0 16px', textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Photos
            </p>
            {memoryDays
              .filter(day => (day.photos?.length ?? 0) > 0)
              .map(day => (
                <div key={day.dayNumber} style={{ marginBottom: 32 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 12,
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#FF8210', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12,
                      flexShrink: 0,
                    }}>
                      {day.dayNumber}
                    </span>
                    <span style={{
                      fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15,
                      color: '#00447B',
                    }}>
                      {day.dayTitle}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: day.photos.length === 1
                      ? '1fr'
                      : day.photos.length === 2
                        ? '1fr 1fr'
                        : 'repeat(3, 1fr)',
                    gap: 6,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    {day.photos
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .slice(0, 6)
                      .map((photo, idx) => (
                        <div
                          key={photo.id}
                          style={{
                            aspectRatio: idx === 0 && day.photos.length > 2 ? '16/9' : '1',
                            gridColumn: idx === 0 && day.photos.length > 2 ? 'span 2' : undefined,
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: '#E5E7EB',
                          }}
                        >
                          <img
                            src={getPhotoUrl(photo)}
                            alt={`Day ${day.dayNumber}`}
                            loading="lazy"
                            style={{
                              width: '100%', height: '100%',
                              objectFit: 'cover', display: 'block',
                            }}
                          />
                        </div>
                      ))}
                  </div>

                  {day.photos.length > 6 && (
                    <p style={{
                      fontFamily: "'Inter',sans-serif", fontSize: 12,
                      color: '#C0C0C0', marginTop: 6, textAlign: 'center',
                    }}>
                      +{day.photos.length - 6} more photos
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 48, textAlign: 'center',
          padding: '32px 24px',
          background: '#fff', borderRadius: 16,
          border: '1.5px solid rgba(0,68,123,0.08)',
        }}>
          <p style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20,
            color: '#00447B', margin: '0 0 8px',
          }}>
            Ready to write your own story?
          </p>
          <p style={{
            fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#6C6D6F',
            margin: '0 0 24px', lineHeight: 1.6,
          }}>
            Luna builds your personalised itinerary in under 90 seconds. Then captures every memory along the way.
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '14px 32px', borderRadius: 12,
            background: '#FF8210', color: '#fff',
            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(255,130,16,0.3)',
          }}>
            Plan your own trip
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}
