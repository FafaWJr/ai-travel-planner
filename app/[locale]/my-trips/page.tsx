'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import NavBar from '@/components/NavBar';
import { Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { COLLAB_ENABLED, type CollabRole } from '@/lib/collaboration';
import { RoleBadge } from '@/components/collab/RoleBadge';

function isTripExpired(startDate?: string | null, endDate?: string | null): boolean {
  const referenceDate = endDate || startDate;
  if (!referenceDate) return false;
  const tripDate = new Date(referenceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tripDate < today;
}

interface SavedTrip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  is_favorite: boolean;
  created_at: string;
  trip_data: { prompt?: string } | null;
}

export default function MyTripsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('myTrips');

  const locale = useLocale();
  const [trips,        setTrips]        = useState<SavedTrip[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [collabCounts, setCollabCounts] = useState<Record<string, number>>({});
  const [sharedTrips, setSharedTrips] = useState<Array<{ id: string; title: string | null; destination: string | null; role: CollabRole; ownerName: string }>>([]);

  useEffect(() => {
    if (!COLLAB_ENABLED || !user) {
      setSharedTrips([]);
      setCollabCounts({});
      return;
    }
    (async () => {
      const [sharedRes, countsRes] = await Promise.all([
        fetch('/api/trips/shared'),
        fetch('/api/trips/collab-counts'),
      ]);
      if (sharedRes.ok) {
        const body = await sharedRes.json();
        setSharedTrips(body.trips ?? []);
      }
      if (countsRes.ok) {
        const body = await countsRes.json();
        setCollabCounts(body.counts ?? {});
      }
    })();
  }, [user]);

  /* Redirect if not logged in */
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login?next=/my-trips');
  }, [user, authLoading]); // eslint-disable-line

  /* Fetch trips once we have a user — only owned trips (user_id match) */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('saved_trips')
        .select('id, user_id, title, destination, start_date, end_date, is_favorite, created_at, trip_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTrips((data as SavedTrip[]) || []);
      setLoading(false);
    })();
  }, [user]); // eslint-disable-line

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from('saved_trips').update({ is_favorite: !current }).eq('id', id);
    setTrips(prev => prev.map(item => item.id === id ? { ...item, is_favorite: !current } : item));
  };

  const deleteTrip = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingId(id);
    await supabase.from('saved_trips').delete().eq('id', id);
    setTrips(prev => prev.filter(item => item.id !== id));
    setDeletingId(null);
  };

  const viewTrip = (trip: SavedTrip) => {
    const p = trip.trip_data?.prompt || `plan a trip to ${trip.destination}`;
    router.push(`/plan?tripId=${trip.id}&prompt=${encodeURIComponent(p)}`);
  };

  const numDays = (trip: SavedTrip) => {
    if (!trip.start_date || !trip.end_date) return null;
    return Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000);
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FB' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.12)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ background: '#F4F7FB', minHeight: '100vh', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 60px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 36, color: '#00447B', marginBottom: 6 }}>
            {t('title')}
          </h1>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, color: '#6C6D6F' }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.12)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter',sans-serif", color: '#6C6D6F', fontSize: 15 }}>{t('loading')}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <svg width="128" height="108" viewBox="0 0 128 108" fill="none" style={{ marginBottom: 24 }}>
              <rect x="8" y="22" width="112" height="76" rx="10" fill="#EEF3F9" stroke="rgba(0,68,123,0.12)" strokeWidth="1.5"/>
              <rect x="20" y="38" width="44" height="6" rx="3" fill="rgba(0,68,123,0.18)"/>
              <rect x="20" y="50" width="68" height="4" rx="2" fill="rgba(0,68,123,0.10)"/>
              <rect x="20" y="60" width="56" height="4" rx="2" fill="rgba(0,68,123,0.10)"/>
              <rect x="20" y="70" width="40" height="4" rx="2" fill="rgba(0,68,123,0.08)"/>
              <circle cx="98" cy="80" r="20" fill="rgba(255,130,16,0.10)" stroke="#FF8210" strokeWidth="1.5"/>
              <path d="M98 70v20M88 80h20" stroke="#FF8210" strokeWidth="2" strokeLinecap="round"/>
              <path d="M28 8l6 6-6 6" stroke="#679AC1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="13" r="5" fill="none" stroke="#679AC1" strokeWidth="1.5"/>
            </svg>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22, color: '#00447B', marginBottom: 10 }}>
              {t('emptyHeading')}
            </h2>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: '#6C6D6F', marginBottom: 28, maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
              {t('emptySubtext')}
            </p>
            <Link href="/" style={{
              display: 'inline-block', padding: '13px 32px', background: '#FF8210', color: '#fff',
              fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15,
              borderRadius: 100, textDecoration: 'none',
            }}>
              {t('emptyCta')}
            </Link>
          </div>
        )}

        {/* Trip grid */}
        {!loading && trips.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {trips.map(trip => (
              <div
                key={trip.id}
                style={{
                  background: '#fff', borderRadius: 16,
                  border: '1.5px solid rgba(0,68,123,0.10)',
                  boxShadow: '0 2px 16px rgba(0,68,123,0.06)',
                  overflow: 'hidden', transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,68,123,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,68,123,0.06)')}
              >
                {/* Card header */}
                <div style={{ background: 'linear-gradient(135deg,#00447B,#005FAD)', padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <h3 style={{
                      fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 16,
                      color: '#fff', lineHeight: 1.35, margin: 0, flex: 1,
                    }}>
                      {trip.destination}
                    </h3>
                    {/* Favorite toggle */}
                    <button
                      onClick={() => toggleFavorite(trip.id, trip.is_favorite)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                      aria-label={trip.is_favorite ? t('tripCard.removeFavorite') : t('tripCard.addFavorite')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24"
                        fill={trip.is_favorite ? '#FF8210' : 'none'}
                        stroke={trip.is_favorite ? '#FF8210' : 'rgba(255,255,255,0.65)'}
                        strokeWidth="2"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {numDays(trip) && (
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '3px 10px',
                        fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.9)',
                      }}>
                        {t('tripCard.days', { n: numDays(trip)! })}
                      </span>
                    )}
                    {COLLAB_ENABLED && collabCounts[trip.id] > 0 && (
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(255,189,89,0.25)', borderRadius: 100, padding: '3px 10px',
                        fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.9)',
                      }}>
                        {t('sharedWith', { count: collabCounts[trip.id] })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 20px 20px' }}>
                  {(trip.start_date || trip.end_date) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#6C6D6F', margin: 0 }}>
                        {fmtDate(trip.start_date)}{trip.start_date && trip.end_date ? ' \u2192 ' : ''}{fmtDate(trip.end_date)}
                      </p>
                      {isTripExpired(trip.start_date, trip.end_date) && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          backgroundColor: '#f3f4f6', color: '#6C6D6F',
                          border: '1px solid #C0C0C0', borderRadius: 999,
                          padding: '2px 10px', fontSize: 11,
                          fontFamily: 'Inter, sans-serif', fontWeight: 600,
                          letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.4,
                        }}>
                          <Clock size={11} color="#6C6D6F" />
                          {t('tripCard.expired')}
                        </span>
                      )}
                    </div>
                  )}
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#C0C0C0', marginBottom: 16 }}>
                    {t('tripCard.saved', { date: fmtDate(trip.created_at) })}
                  </p>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* View trip */}
                    <button
                      onClick={() => viewTrip(trip)}
                      style={{
                        flex: 1, padding: '9px 0',
                        border: '1.5px solid #00447B', color: '#00447B',
                        background: 'none', borderRadius: 100, cursor: 'pointer',
                        fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#00447B'; b.style.color = '#fff'; }}
                      onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'none'; b.style.color = '#00447B'; }}
                    >
                      {t('tripCard.viewTrip')}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      disabled={deletingId === trip.id}
                      aria-label={t('tripCard.deleteTrip')}
                      style={{
                        width: 36, height: 36, border: 'none',
                        background: 'rgba(192,192,192,0.12)',
                        borderRadius: 100, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#C0C0C0', transition: 'color 0.15s, background 0.15s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { const b = e.currentTarget; b.style.color = '#DC2626'; b.style.background = 'rgba(220,38,38,0.08)'; }}
                      onMouseLeave={e => { const b = e.currentTarget; b.style.color = '#C0C0C0'; b.style.background = 'rgba(192,192,192,0.12)'; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shared with me — flag-gated */}
        {COLLAB_ENABLED && sharedTrips.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", color: '#00447B', marginBottom: 12, fontSize: 20 }}>
              {t('sharedSection')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {sharedTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/plan?tripId=${trip.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: '1.5px solid rgba(0,68,123,0.10)',
                    boxShadow: '0 2px 16px rgba(0,68,123,0.06)',
                    overflow: 'hidden',
                    padding: 20,
                    transition: 'box-shadow 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 16, color: '#00447B', margin: 0, flex: 1 }}>
                        {trip.title || trip.destination || t('untitled')}
                      </h3>
                      <RoleBadge role={trip.role} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                      {t('sharedBy', { name: trip.ownerName })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="padding: '96px 24px 60px'"] { padding-top: 88px !important; }
        }
      `}</style>
    </div>
  );
}
