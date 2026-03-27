'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import NavBar from '@/components/NavBar';

interface SavedTrip {
  id: string;
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

  const [trips,      setTrips]      = useState<SavedTrip[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* Redirect if not logged in */
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login?next=/my-trips');
  }, [user, authLoading]); // eslint-disable-line

  /* Fetch trips once we have a user */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('saved_trips')
        .select('*')
        .order('created_at', { ascending: false });
      setTrips((data as SavedTrip[]) || []);
      setLoading(false);
    })();
  }, [user]); // eslint-disable-line

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from('saved_trips').update({ is_favorite: !current }).eq('id', id);
    setTrips(prev => prev.map(t => t.id === id ? { ...t, is_favorite: !current } : t));
  };

  const deleteTrip = async (id: string) => {
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    setDeletingId(id);
    await supabase.from('saved_trips').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
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
            My Trips
          </h1>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, color: '#6C6D6F' }}>
            All your saved travel plans in one place.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.12)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter',sans-serif", color: '#6C6D6F', fontSize: 15 }}>Loading your trips…</p>
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
              You haven't saved any trips yet
            </h2>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: '#6C6D6F', marginBottom: 28, maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Plan your next adventure and tap "Save trip" to keep it here.
            </p>
            <Link href="/" style={{
              display: 'inline-block', padding: '13px 32px', background: '#FF8210', color: '#fff',
              fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15,
              borderRadius: 100, textDecoration: 'none',
            }}>
              Plan a new trip
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
                      aria-label={trip.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
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
                  {numDays(trip) && (
                    <span style={{
                      display: 'inline-block', marginTop: 8,
                      background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '3px 10px',
                      fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.9)',
                    }}>
                      {numDays(trip)} days
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 20px 20px' }}>
                  {(trip.start_date || trip.end_date) && (
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#6C6D6F', marginBottom: 6 }}>
                      {fmtDate(trip.start_date)}{trip.start_date && trip.end_date ? ' → ' : ''}{fmtDate(trip.end_date)}
                    </p>
                  )}
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#C0C0C0', marginBottom: 16 }}>
                    Saved {fmtDate(trip.created_at)}
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
                      View trip
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      disabled={deletingId === trip.id}
                      aria-label="Delete trip"
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
