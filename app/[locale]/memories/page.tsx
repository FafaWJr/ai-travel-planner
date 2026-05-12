'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import NavBar from '@/components/NavBar';
import { BookHeart, ArrowRight, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface SavedTrip {
  id: string;
  destination: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
}

export default function MemoriesLandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('memories');
  const locale = useLocale();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travellers, setTravellers] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [pastTrips, setPastTrips] = useState<SavedTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingTrips(true);
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('saved_trips')
          .select('id, destination, title, start_date, end_date')
          .lt('end_date', today)
          .order('end_date', { ascending: false })
          .limit(6);
        setPastTrips(data ?? []);
      } catch (err) {
        console.error('[memories] fetch past trips error:', err);
      } finally {
        setLoadingTrips(false);
      }
    })();
  }, [user]);

  const handleCreate = async () => {
    if (!destination.trim() || !startDate || !endDate) {
      setFormError(t('formError'));
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const res = await fetch('/api/memories/standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          startDate,
          endDate,
          travellers: travellers.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { memory } = await res.json();

      const numDays = Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000,
      ) + 1;

      try {
        const skelRes = await fetch('/api/memories/skeleton', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: destination.trim(), numDays, locale }),
        });
        if (skelRes.ok) {
          const { titles } = await skelRes.json();
          if (titles && titles.length > 0) {
            const days = memory.memory_data.days.map(
              (d: { dayNumber: number; dayTitle: string }, i: number) => ({
                ...d,
                dayTitle: titles[i] ?? d.dayTitle,
              }),
            );
            await fetch(`/api/memories/${memory.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memory_data: { ...memory.memory_data, days } }),
            });
          }
        }
      } catch {
        // Skeleton failed — continue with generic day titles
      }

      router.push(`/memories/${memory.id}`);
    } catch (err) {
      console.error('[memories] standalone create error:', err);
      setFormError('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 60px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <BookHeart size={36} color="#FF8210" style={{ marginBottom: 16 }} />
          <h1 style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 36,
            color: '#00447B', margin: '0 0 12px', lineHeight: 1.15,
          }}>
            {t('landingTitle')}
          </h1>
          <p style={{
            fontFamily: "'Inter',sans-serif", fontSize: 16, color: '#6C6D6F',
            maxWidth: 520, margin: '0 auto', lineHeight: 1.7,
          }}>
            {t('landingSubtitle')}
          </p>
        </div>

        {/* Two-column layout: past trips (auth only) + standalone form */}
        <div
          className="memories-landing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: user ? '1fr 1fr' : '1fr',
            gap: 24,
          }}
        >
          {/* Past Luna trips (authenticated only) */}
          {user && (
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1.5px solid rgba(0,68,123,0.08)',
              padding: 28, boxShadow: '0 2px 12px rgba(0,68,123,0.04)',
            }}>
              <h2 style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 17,
                color: '#00447B', margin: '0 0 16px',
              }}>
                {t('fromLunaTrip')}
              </h2>

              {loadingTrips ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <Loader2 size={20} color="#FF8210" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : pastTrips.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pastTrips.map(trip => (
                    <Link
                      key={trip.id}
                      href={`/memories/${trip.id}`}
                      className="trip-card"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 10,
                        border: '1.5px solid rgba(0,68,123,0.08)',
                        textDecoration: 'none',
                      }}
                    >
                      <MapPin size={16} color="#FF8210" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
                          color: '#00447B', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {trip.destination || trip.title || t('untitledTrip')}
                        </p>
                        {trip.end_date && (
                          <p style={{
                            fontFamily: "'Inter',sans-serif", fontSize: 12,
                            color: '#C0C0C0', margin: '2px 0 0',
                          }}>
                            {new Date(trip.end_date).toLocaleDateString('en-GB', {
                              month: 'short', year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={14} color="#C0C0C0" style={{ flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#C0C0C0',
                  textAlign: 'center', padding: 16,
                }}>
                  {t('noPastTrips')}
                </p>
              )}
            </div>
          )}

          {/* Standalone form */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1.5px solid rgba(0,68,123,0.08)',
            padding: 28, boxShadow: '0 2px 12px rgba(0,68,123,0.04)',
          }}>
            <h2 style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 17,
              color: '#00447B', margin: '0 0 16px',
            }}>
              {t('captureAnyTrip')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Destination */}
              <div>
                <label style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                  color: '#6C6D6F', display: 'block', marginBottom: 6,
                }}>
                  <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('destination')}
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder={t('destinationPlaceholder')}
                  className="mem-input"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1.5px solid rgba(0,68,123,0.12)',
                    fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
                    outline: 'none', boxSizing: 'border-box', background: '#fff',
                  }}
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{
                    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                    color: '#6C6D6F', display: 'block', marginBottom: 6,
                  }}>
                    <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {t('startDate')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="mem-input"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1.5px solid rgba(0,68,123,0.12)',
                      fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                    color: '#6C6D6F', display: 'block', marginBottom: 6,
                  }}>
                    <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {t('endDate')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="mem-input"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1.5px solid rgba(0,68,123,0.12)',
                      fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Travellers (optional) */}
              <div>
                <label style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                  color: '#6C6D6F', display: 'block', marginBottom: 6,
                }}>
                  <Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('travellers')}
                </label>
                <input
                  type="text"
                  value={travellers}
                  onChange={e => setTravellers(e.target.value)}
                  placeholder={t('travellersPlaceholder')}
                  className="mem-input"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1.5px solid rgba(0,68,123,0.12)',
                    fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
                    outline: 'none', boxSizing: 'border-box', background: '#fff',
                  }}
                />
              </div>

              {formError && (
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 13,
                  color: '#DC2626', margin: 0,
                }}>
                  {formError}
                </p>
              )}

              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: creating ? 'rgba(255,130,16,0.6)' : '#FF8210',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15,
                  cursor: creating ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
              >
                {creating && (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {creating ? t('creatingMemory') : t('startCapturing')}
              </button>

              {!user && (
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#C0C0C0',
                  textAlign: 'center', margin: 0,
                }}>
                  {t('loginToSave')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .mem-input::placeholder { color: #C0C0C0; }
        .mem-input:focus { border-color: #FF8210 !important; }
        .trip-card { transition: border-color 0.15s; }
        .trip-card:hover { border-color: #FF8210 !important; }
        @media (max-width: 640px) {
          .memories-landing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
