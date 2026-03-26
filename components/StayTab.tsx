'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

/* ─── Types ──────────────────────────────────────────────────── */
export interface Hotel {
  id: string;
  name: string;
  stars: number;
  description: string;
  priceRange: string;
  neighborhood: string;
  amenities: string[];
  googleMapsQuery: string;
}

export interface LocationSegment {
  location: string;
  label: string;
  checkIn: string;
  checkOut: string;
  dayRange: [number, number];
  hotels: Hotel[];
}

export interface AcceptedHotel {
  hotel: Hotel;
  segment: LocationSegment;
}

interface Props {
  prompt: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  budget: string;
  onAddToItinerary: (text: string, dayNum: number, slot: TimeSlot) => void;
  onHotelsConfirmed: (hotels: AcceptedHotel[]) => void;
}

/* ─── Quick filter options ───────────────────────────────────── */
const QUICK_FILTERS = [
  { id: 'closer',    label: '📍 Closer to activities' },
  { id: 'cheaper',   label: '💰 Lower budget' },
  { id: 'luxury',    label: '✨ More luxurious' },
  { id: 'pool',      label: '🏊 With pool' },
  { id: 'breakfast', label: '🍳 With breakfast' },
  { id: 'pets',      label: '🐾 Pet friendly' },
];

/* ─── Star rating display ────────────────────────────────────── */
function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(Math.min(5, Math.max(1, n)))}{'☆'.repeat(Math.max(0, 5 - n))}
    </span>
  );
}

/* ─── Amenity pill ───────────────────────────────────────────── */
function AmenityPill({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'rgba(0,68,123,0.07)',
      color: '#00447B',
      fontFamily: "'Inter',sans-serif",
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 9px',
      borderRadius: 100,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

/* ─── Photo gallery carousel ─────────────────────────────────── */
function PhotoGallery({ photos, name }: { photos: string[] | null | '__loading__'; name: string }) {
  const [idx, setIdx] = useState(0);

  if (photos === '__loading__') {
    return (
      <div style={{ height: 180, background: 'linear-gradient(135deg,#e8f0f7,#d1e2f0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.15)', borderTop: '3px solid #FF8210', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div style={{ height: 180, background: 'linear-gradient(135deg,#00447B,#0369A1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 32 }}>🏨</span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{name}</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <img
        src={photos[idx]}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); }}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >‹</button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >›</button>
          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {photos.map((_, i) => (
              <div
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{
                  width: i === idx ? 16 : 6, height: 6, borderRadius: 100,
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Hotel card ─────────────────────────────────────────────── */
function HotelCard({
  hotel, isSeen, isConfirmed, onChoose, photos,
}: {
  hotel: Hotel;
  isSeen: boolean;
  isConfirmed: boolean;
  onChoose: () => void;
  photos: string[] | null | '__loading__';
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.googleMapsQuery)}`;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: isConfirmed
        ? '2px solid #16A34A'
        : '1.5px solid rgba(0,68,123,0.10)',
      boxShadow: isConfirmed
        ? '0 4px 20px rgba(22,163,74,0.12)'
        : '0 2px 12px rgba(0,68,123,0.06)',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      position: 'relative',
    }}>
      {/* Already seen badge */}
      {isSeen && !isConfirmed && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 5,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 600,
          padding: '3px 8px', borderRadius: 100,
        }}>Already seen</div>
      )}
      {/* Confirmed badge */}
      {isConfirmed && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 5,
          background: '#16A34A', color: '#fff',
          fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700,
          padding: '4px 12px', borderRadius: 100,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>✓ Your stay</div>
      )}

      {/* Photos */}
      <PhotoGallery photos={photos} name={hotel.name} />

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Name + stars */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: '#111', margin: 0, flex: 1 }}>{hotel.name}</p>
          <Stars n={hotel.stars} />
        </div>

        {/* Neighborhood + map link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F' }}>📍 {hotel.neighborhood}</span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#FF8210', fontWeight: 600, textDecoration: 'none', marginLeft: 2 }}
          >
            View on map ↗
          </a>
        </div>

        {/* Description */}
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.6, margin: '0 0 10px' }}>
          {hotel.description}
        </p>

        {/* Amenities */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {hotel.amenities.slice(0, 5).map(a => <AmenityPill key={a} label={a} />)}
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: '#00447B' }}>{hotel.priceRange}</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>(estimated)</span>
          </div>
          {isConfirmed ? (
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✓ Added to itinerary</span>
          ) : (
            <button
              onClick={onChoose}
              style={{
                background: '#00447B', color: '#fff', border: 'none',
                borderRadius: 100, padding: '9px 18px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget).style.background = '#003566'; }}
              onMouseLeave={e => { (e.currentTarget).style.background = '#00447B'; }}
            >
              Choose This Stay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Segment confirmed summary ──────────────────────────────── */
function ConfirmedSummary({ hotel, segment }: AcceptedHotel) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.googleMapsQuery)}`;
  return (
    <div style={{
      background: 'rgba(22,163,74,0.06)', border: '1.5px solid rgba(22,163,74,0.25)',
      borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <span style={{ fontSize: 26, flexShrink: 0 }}>🏨</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 2px' }}>{hotel.name}</p>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F', margin: '0 0 4px' }}>
          📍 {hotel.neighborhood} · {segment.checkIn || 'Check-in'} → {segment.checkOut || 'Check-out'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {hotel.amenities.slice(0, 4).map(a => <AmenityPill key={a} label={a} />)}
        </div>
      </div>
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#FF8210', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
        Map ↗
      </a>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function StayTab({ prompt, destination, checkIn, checkOut, budget, onAddToItinerary, onHotelsConfirmed }: Props) {
  const [segments,        setSegments]        = useState<LocationSegment[]>([]);
  const [seenIds,         setSeenIds]         = useState<Set<string>>(new Set());
  const [confirmed,       setConfirmed]       = useState<Record<string, AcceptedHotel>>({});
  const [loading,         setLoading]         = useState(false);
  const [loadingMore,     setLoadingMore]     = useState(false);
  const [error,           setError]           = useState('');
  const [activeFilters,   setActiveFilters]   = useState<string[]>([]);
  const [showFilters,     setShowFilters]     = useState(false);
  const [toast,           setToast]           = useState<string | null>(null);
  const [photoCache,      setPhotoCache]      = useState<Record<string, string[] | null | '__loading__'>>({});
  const hasFetched = useRef(false);

  /* ── Fetch hotel photos for a segment's hotels ── */
  const fetchPhotos = useCallback(async (hotels: Hotel[]) => {
    for (const hotel of hotels) {
      const key = hotel.id;
      if (photoCache[key] !== undefined) continue;

      setPhotoCache(prev => ({ ...prev, [key]: '__loading__' }));

      const urls: string[] = [];
      try {
        // 1. Try hotel Wikipedia page
        const r1 = await fetch(`/api/place-photo?q=${encodeURIComponent(hotel.name)}`);
        const d1 = await r1.json();
        if (d1.url) urls.push(d1.url);
      } catch { /* ignore */ }

      try {
        // 2. Area/neighbourhood photos for gallery filler
        const q2 = `${hotel.neighborhood} ${destination}`;
        const r2 = await fetch(`/api/destination-photos?city=${encodeURIComponent(q2)}`);
        const d2 = await r2.json();
        (d2.photos as string[] || []).forEach((u: string) => {
          if (!urls.includes(u)) urls.push(u);
        });
      } catch { /* ignore */ }

      setPhotoCache(prev => ({ ...prev, [key]: urls.length > 0 ? urls.slice(0, 4) : null }));
    }
  }, [destination, photoCache]);

  /* ── Load suggestions ── */
  const loadSuggestions = useCallback(async (opts: { excludeNames?: string[]; isMore?: boolean } = {}) => {
    const { excludeNames = [], isMore = false } = opts;
    isMore ? setLoadingMore(true) : setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hotel-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, destination, checkIn, checkOut, budget, excludeNames, filters: activeFilters }),
      });
      if (!res.ok) throw new Error('Failed to load suggestions');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newSegs: LocationSegment[] = data.segments || [];

      // Track all IDs we've now seen (before state update, so old seenIds apply for badge logic)
      const newSeen = new Set(seenIds);
      newSegs.forEach(s => s.hotels.forEach(h => newSeen.add(h.id)));
      setSeenIds(newSeen);
      setSegments(newSegs);

      // Kick off photo fetching for all hotels
      const allHotels = newSegs.flatMap(s => s.hotels);
      fetchPhotos(allHotels);
    } catch (e: any) {
      setError(e.message || 'Could not load hotel suggestions. Please try again.');
    } finally {
      isMore ? setLoadingMore(false) : setLoading(false);
    }
  }, [prompt, destination, checkIn, checkOut, budget, activeFilters, seenIds, fetchPhotos]);

  /* ── Initial load (once) ── */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadSuggestions();
  }, []); // eslint-disable-line

  /* ── Toast auto-dismiss ── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Choose hotel ── */
  const chooseHotel = (hotel: Hotel, segment: LocationSegment) => {
    const newConfirmed = { ...confirmed, [segment.location]: { hotel, segment } };
    setConfirmed(newConfirmed);
    onHotelsConfirmed(Object.values(newConfirmed));

    // Add check-in to first day of segment
    const checkInDay = segment.dayRange[0];
    const checkOutDay = segment.dayRange[1];
    onAddToItinerary(
      `🏨 **Check-in: ${hotel.name}** (${hotel.neighborhood}) — ${hotel.priceRange}`,
      checkInDay,
      'morning',
    );
    if (checkOutDay > checkInDay) {
      onAddToItinerary(`🏨 **Check-out: ${hotel.name}**`, checkOutDay, 'morning');
    }

    setToast(`${hotel.name} added to your itinerary!`);
  };

  /* ── Give me more ── */
  const handleMoreOptions = () => {
    const allCurrentNames = segments.flatMap(s => s.hotels.map(h => h.name));
    loadSuggestions({ excludeNames: allCurrentNames, isMore: true });
  };

  /* ── Toggle filter ── */
  const toggleFilter = (id: string) => {
    setActiveFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const confirmedCount = Object.keys(confirmed).length;
  const totalSegments  = segments.length;

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: '#00447B', margin: '0 0 4px' }}>
              Where to Stay
            </h2>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#6C6D6F', margin: 0 }}>
              Curated picks matched to your trip, budget and travel style
            </p>
          </div>
          {/* Segment completion indicator */}
          {totalSegments > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {segments.map(seg => {
                const isConfirmed = !!confirmed[seg.location];
                return (
                  <span key={seg.location} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: isConfirmed ? 'rgba(22,163,74,0.10)' : 'rgba(0,68,123,0.07)',
                    color: isConfirmed ? '#16A34A' : '#6C6D6F',
                    fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 100,
                  }}>
                    {isConfirmed ? '✓' : '○'} {seg.location}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1.5px solid rgba(0,68,123,0.08)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.10)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15, color: '#00447B', marginBottom: 6 }}>Finding the best stays for you...</p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#9CA3AF' }}>Matching hotels to your itinerary and travel style</p>
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', border: '1.5px solid rgba(220,38,38,0.15)' }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error}</p>
          <button
            onClick={() => loadSuggestions()}
            style={{ background: '#FF8210', color: '#fff', border: 'none', borderRadius: 100, padding: '9px 22px', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Segments ── */}
      {!loading && !error && segments.map((segment, segIdx) => {
        const segConfirmed = confirmed[segment.location];

        return (
          <div key={segment.location} style={{ marginBottom: segIdx < segments.length - 1 ? 36 : 0 }}>

            {/* Segment divider (multi-location) */}
            {segments.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,68,123,0.10)' }} />
                <div style={{
                  background: segConfirmed ? 'rgba(22,163,74,0.10)' : 'rgba(0,68,123,0.08)',
                  border: `1.5px solid ${segConfirmed ? 'rgba(22,163,74,0.3)' : 'rgba(0,68,123,0.15)'}`,
                  borderRadius: 100, padding: '5px 16px',
                  fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12,
                  color: segConfirmed ? '#16A34A' : '#00447B',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>🏙️</span> {segment.label}
                  {segConfirmed && <span style={{ marginLeft: 4 }}>✓</span>}
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,68,123,0.10)' }} />
              </div>
            )}

            {/* Confirmed hotel summary */}
            {segConfirmed && (
              <div style={{ marginBottom: 16 }}>
                <ConfirmedSummary hotel={segConfirmed.hotel} segment={segConfirmed.segment} />
              </div>
            )}

            {/* Hotel cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {segment.hotels.map(hotel => {
                const isConfirmed = segConfirmed?.hotel.id === hotel.id;
                // Mark as "already seen" only if shown BEFORE the current render batch
                const wasSeen = seenIds.has(hotel.id) && !segment.hotels.some(h => h.id === hotel.id && !seenIds.has(h.id));
                return (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    isSeen={false /* handled by separate "seen" tracking across refreshes */}
                    isConfirmed={isConfirmed}
                    onChoose={() => chooseHotel(hotel, segment)}
                    photos={photoCache[hotel.id] ?? '__loading__'}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Give me more options ── */}
      {!loading && segments.length > 0 && (
        <div style={{ marginTop: 24 }}>

          {/* Filter chips */}
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1.5px dashed rgba(0,68,123,0.25)',
                borderRadius: 100, padding: '7px 16px', cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12, color: '#00447B',
              }}
            >
              <span>⚙️</span> Refine preferences
              <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
              {activeFilters.length > 0 && (
                <span style={{ background: '#FF8210', color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700, marginLeft: 2 }}>{activeFilters.length}</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1.5px solid rgba(0,68,123,0.08)' }}>
              {QUICK_FILTERS.map(f => {
                const active = activeFilters.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFilter(f.id)}
                    style={{
                      background: active ? '#FF8210' : 'rgba(255,130,16,0.07)',
                      color: active ? '#fff' : '#FF8210',
                      border: `1.5px solid ${active ? '#FF8210' : 'rgba(255,130,16,0.30)'}`,
                      borderRadius: 100, padding: '6px 14px',
                      fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{f.label}</button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleMoreOptions}
            disabled={loadingMore}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: loadingMore ? 'rgba(0,68,123,0.05)' : '#fff',
              border: '1.5px solid rgba(0,68,123,0.20)',
              borderRadius: 100, padding: '10px 22px',
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#00447B',
              cursor: loadingMore ? 'default' : 'pointer', transition: 'all 0.15s',
              opacity: loadingMore ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.background = 'rgba(0,68,123,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            {loadingMore
              ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,68,123,0.15)', borderTop: '2px solid #00447B', animation: 'spin 0.9s linear infinite' }} /> Finding more options...</>
              : <><span style={{ fontSize: 16 }}>🔄</span> Give me more options</>
            }
          </button>
        </div>
      )}

      {/* ── Trip accommodation completion banner ── */}
      {confirmedCount > 0 && confirmedCount >= totalSegments && totalSegments > 0 && (
        <div style={{
          marginTop: 24, padding: '14px 18px',
          background: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.25)',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#15803D', margin: 0 }}>
            All accommodation confirmed! Your hotels have been added to the itinerary.
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
          background: '#15803D', color: '#fff',
          padding: '12px 22px', borderRadius: 100,
          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
          boxShadow: '0 6px 24px rgba(0,0,0,0.20)',
          zIndex: 9999, whiteSpace: 'nowrap',
          animation: 'fadeIn 0.2s ease both',
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
