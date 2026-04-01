'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ItineraryHandle } from '@/components/EditableItinerary';
import { bookingComLink } from '@/lib/affiliate';

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
  itineraryRef?: React.RefObject<ItineraryHandle | null>;
  onAddToItinerary: (text: string, dayNum: number, slot: TimeSlot) => void;
  onRemoveActivitiesMatching: (pattern: string) => void;
  onHotelsConfirmed: (hotels: AcceptedHotel[]) => void;
  externalAccepted?: AcceptedHotel[];
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

/* ─── Picsum fallback ────────────────────────────────────────── */
function picsumFallback(seed: string): string {
  // Deterministic, always-available fallback using picsum.photos
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/500`;
}

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
  const fallback = picsumFallback(name);

  if (!photos || photos === '__loading__') {
    return (
      <div style={{ height: 180, background: 'linear-gradient(135deg,#00447B,#0369A1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 32 }}>🏨</span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{name}</span>
      </div>
    );
  }

  const urls = photos.length > 0 ? photos : [fallback];

  return (
    <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#e5e7eb' }}>
      <img
        src={urls[idx]}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
        onError={e => {
          const img = e.target as HTMLImageElement;
          if (!img.src.includes('picsum.photos')) img.src = fallback;
        }}
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + urls.length) % urls.length); }}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >‹</button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % urls.length); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >›</button>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {urls.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 100, background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Hotel card ─────────────────────────────────────────────── */
function HotelCard({
  hotel, isConfirmed, onChoose, photos, destination,
}: {
  hotel: Hotel;
  isConfirmed: boolean;
  onChoose: () => void;
  photos: string[] | null | '__loading__';
  destination: string;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.googleMapsQuery)}`;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: isConfirmed ? '2px solid #16A34A' : '1.5px solid rgba(0,68,123,0.10)',
      boxShadow: isConfirmed ? '0 4px 20px rgba(22,163,74,0.12)' : '0 2px 12px rgba(0,68,123,0.06)',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {isConfirmed && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, background: '#16A34A', color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 5 }}>✓ Your stay</div>
      )}
      <PhotoGallery photos={photos} name={hotel.name} />
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: '#111', margin: 0, flex: 1 }}>{hotel.name}</p>
          <Stars n={hotel.stars} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F' }}>📍 {hotel.neighborhood}</span>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#FF8210', fontWeight: 600, textDecoration: 'none', marginLeft: 2 }}>
            View on map ↗
          </a>
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.6, margin: '0 0 10px', flex: 1 }}>
          {hotel.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {hotel.amenities.slice(0, 5).map(a => <AmenityPill key={a} label={a} />)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: '#00447B' }}>{hotel.priceRange}</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>(est.)</span>
          </div>
          {isConfirmed ? (
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✓ Added</span>
          ) : (
            <button onClick={onChoose}
              style={{ background: '#00447B', color: '#fff', border: 'none', borderRadius: 100, padding: '9px 18px', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#003566'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#00447B'; }}
            >Choose This Stay</button>
          )}
        </div>
        {/* Booking.com affiliate button */}
        <a
          href={bookingComLink(hotel.neighborhood ? `${hotel.name}, ${destination}` : destination)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            marginTop: 12, padding: '9px 18px',
            background: '#003580', color: 'white',
            borderRadius: 8, width: '100%', justifyContent: 'center',
            fontFamily: "'Lato', sans-serif", fontSize: 13, fontWeight: 700,
            textDecoration: 'none', transition: 'background 0.2s',
            boxSizing: 'border-box',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#00224f')}
          onMouseLeave={e => (e.currentTarget.style.background = '#003580')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Book on Booking.com
        </a>
      </div>
    </div>
  );
}

/* ─── Hotel carousel ─────────────────────────────────────────── */
function HotelCarousel({ hotels, segment, segConfirmed, chooseHotel, photoCache, destination }: {
  hotels: Hotel[];
  segment: LocationSegment;
  segConfirmed: AcceptedHotel | undefined;
  chooseHotel: (hotel: Hotel, segment: LocationSegment) => void;
  photoCache: Record<string, string[] | null | '__loading__'>;
  destination: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => trackRef.current?.scrollBy({ left: dir * 316, behavior: 'smooth' });

  return (
    <div style={{ position: 'relative' }}>
      {/* Left arrow */}
      {hotels.length > 1 && (
        <button onClick={() => scroll(-1)} aria-label="Previous hotels" style={{
          position: 'absolute', left: 0, top: 90, transform: 'translateY(-50%)',
          zIndex: 2, width: 36, height: 36, borderRadius: '50%',
          background: '#00447B', color: '#fff', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,68,123,0.30)', fontSize: 20, lineHeight: 1,
        }}>‹</button>
      )}

      {/* Scrollable track */}
      <div ref={trackRef} style={{
        display: 'flex', gap: 16, overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        padding: hotels.length > 1 ? '4px 44px 12px' : '4px 0 12px',
      }}>
        <style>{`div[data-carousel-track]::-webkit-scrollbar{display:none}`}</style>
        {hotels.map(hotel => (
          <div key={hotel.id} style={{ flex: '0 0 300px', scrollSnapAlign: 'start' }}>
            <HotelCard
              hotel={hotel}
              isConfirmed={segConfirmed?.hotel.id === hotel.id}
              onChoose={() => chooseHotel(hotel, segment)}
              photos={photoCache[hotel.id] ?? '__loading__'}
              destination={destination}
            />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {hotels.length > 1 && (
        <button onClick={() => scroll(1)} aria-label="Next hotels" style={{
          position: 'absolute', right: 0, top: 90, transform: 'translateY(-50%)',
          zIndex: 2, width: 36, height: 36, borderRadius: '50%',
          background: '#00447B', color: '#fff', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,68,123,0.30)', fontSize: 20, lineHeight: 1,
        }}>›</button>
      )}
    </div>
  );
}

/* ─── Segment confirmed summary ──────────────────────────────── */
function ConfirmedSummary({ hotel, segment }: AcceptedHotel) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.googleMapsQuery)}`;
  return (
    <div style={{ background: 'rgba(22,163,74,0.06)', border: '1.5px solid rgba(22,163,74,0.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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

/* ─── Google Places hotel photo lookup ───────────────────────── */
async function fetchHotelPhotosFromAPI(hotelName: string, city: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({ name: hotelName, city });
    const res = await fetch(`/api/hotel-photos?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.photos) ? data.photos : [];
  } catch { return []; }
}

/* ─── Main component ─────────────────────────────────────────── */
export default function StayTab({ prompt, destination, checkIn, checkOut, budget, itineraryRef, onAddToItinerary, onRemoveActivitiesMatching, onHotelsConfirmed, externalAccepted }: Props) {
  const [segments,      setSegments]      = useState<LocationSegment[]>([]);
  const [seenIds,       setSeenIds]       = useState<Set<string>>(new Set());
  const [confirmed,     setConfirmed]     = useState<Record<string, AcceptedHotel>>({});
  const [loading,       setLoading]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [error,         setError]         = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters,   setShowFilters]   = useState(false);
  const [toast,         setToast]         = useState<string | null>(null);
  const [photoCache,    setPhotoCache]    = useState<Record<string, string[] | null | '__loading__'>>({});
  const hasFetched = useRef(false);
  const allSeenNamesRef = useRef<string[]>([]);
  const fetchedRef = useRef<Set<string>>(new Set());

  /* ── Sync Luna-added hotels into confirmed state ── */
  useEffect(() => {
    if (!externalAccepted || externalAccepted.length === 0) return;
    setConfirmed(prev => {
      const updated = { ...prev };
      for (const ah of externalAccepted) {
        const key = ah.segment.location || ah.hotel.name;
        if (!updated[key] || updated[key].hotel.id !== ah.hotel.id) {
          updated[key] = ah;
        }
      }
      return updated;
    });
    // Kick off photo fetches for externally-confirmed hotels
    fetchPhotos(externalAccepted.map(ah => ah.hotel));
  }, [externalAccepted]); // eslint-disable-line

  /* ── Fetch hotel photos via Google Places API ── */
  const fetchPhotos = useCallback(async (hotels: Hotel[]) => {
    const unfetched = hotels.filter(h => !fetchedRef.current.has(h.id));
    if (unfetched.length === 0) return;
    unfetched.forEach(h => fetchedRef.current.add(h.id));

    await Promise.all(unfetched.map(async (hotel) => {
      const photos = await fetchHotelPhotosFromAPI(hotel.name, destination);
      setPhotoCache(prev => ({
        ...prev,
        [hotel.id]: photos.length > 0 ? photos : [picsumFallback(hotel.id)],
      }));
    }));
  }, [destination]);

  /* ── Load suggestions ── */
  const loadSuggestions = useCallback(async (opts: { excludeNames?: string[]; isMore?: boolean } = {}) => {
    const { excludeNames = [], isMore = false } = opts;
    isMore ? setLoadingMore(true) : setLoading(true);
    setError('');

    try {
      let itineraryText = '';
      if (itineraryRef?.current) {
        const snap = itineraryRef.current.getDaysSnapshot();
        itineraryText = snap.map(d => {
          const acts = d.activities
            .filter(a => a.status !== 'declined')
            .map(a => `  ${a.slot}: ${a.text.replace(/\*\*/g, '')}`)
            .join('\n');
          return acts ? `Day ${d.number}: ${d.title}\n${acts}` : `Day ${d.number}: ${d.title}`;
        }).join('\n');
      }

      const res = await fetch('/api/hotel-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, destination, checkIn, checkOut, budget, excludeNames, filters: activeFilters, itineraryText }),
      });
      if (!res.ok) throw new Error('Failed to load suggestions');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newSegs: LocationSegment[] = data.segments || [];

      const newSeen = new Set(seenIds);
      newSegs.forEach(s => s.hotels.forEach(h => newSeen.add(h.id)));
      setSeenIds(newSeen);
      setSegments(newSegs);

      const newNames = newSegs.flatMap(s => s.hotels.map(h => h.name));
      newNames.forEach(n => { if (!allSeenNamesRef.current.includes(n)) allSeenNamesRef.current.push(n); });

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
    const previous = confirmed[segment.location];
    if (previous) {
      onRemoveActivitiesMatching(`Check-in: ${previous.hotel.name}`);
      onRemoveActivitiesMatching(`Check-out: ${previous.hotel.name}`);
    }

    const newConfirmed = { ...confirmed, [segment.location]: { hotel, segment } };
    setConfirmed(newConfirmed);
    onHotelsConfirmed(Object.values(newConfirmed));

    const checkInDay = segment.dayRange[0];
    const segIdx = segments.findIndex(s => s.location === segment.location);
    const nextSeg = segments[segIdx + 1];
    const checkOutDay = nextSeg ? nextSeg.dayRange[0] : segment.dayRange[1];

    onAddToItinerary(
      `🏨 **Check-in: ${hotel.name}** (${hotel.neighborhood}) — ${hotel.priceRange}`,
      checkInDay, 'morning',
    );
    if (checkOutDay > checkInDay) {
      onAddToItinerary(`🏨 **Check-out: ${hotel.name}**`, checkOutDay, 'morning');
    }

    setToast(`${hotel.name} added to your itinerary!`);
  };

  /* ── Give me more ── */
  const handleMoreOptions = () => loadSuggestions({ excludeNames: allSeenNamesRef.current, isMore: true });

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid rgba(0,68,123,0.10)' }}>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 22, color: '#00447B', margin: 0 }}>
          Where to Stay
        </h2>
        {totalSegments > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {segments.map(seg => {
              const isDone = !!confirmed[seg.location];
              return (
                <span key={seg.location} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: isDone ? 'rgba(22,163,74,0.10)' : 'rgba(0,68,123,0.07)',
                  color: isDone ? '#16A34A' : '#6C6D6F',
                  fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600,
                  padding: '4px 12px', borderRadius: 100,
                }}>
                  {isDone ? '✓' : '○'} {seg.location}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Booking.com affiliate banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #003580 0%, #0071c2 100%)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, margin: '0 0 2px' }}>
            Ready to book your stay?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Lato', sans-serif", fontSize: 13, fontWeight: 300, margin: 0 }}>
            Search thousands of hotels on Booking.com. Best price guarantee.
          </p>
        </div>
        <a
          href={bookingComLink(destination)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#FFB700', color: '#003580', borderRadius: 8,
            padding: '10px 20px', fontFamily: "'Poppins', sans-serif",
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Search Hotels →
        </a>
      </div>

      {/* ── Luna-confirmed hotels (not yet in AI suggestion segments) ── */}
      {(externalAccepted ?? []).filter(ah =>
        !segments.some(s => s.location === ah.segment.location)
      ).map(ah => (
        <div key={ah.hotel.id} style={{ marginBottom: 20 }}>
          <ConfirmedSummary hotel={ah.hotel} segment={ah.segment} />
        </div>
      ))}

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
          <button onClick={() => loadSuggestions()}
            style={{ background: '#FF8210', color: '#fff', border: 'none', borderRadius: 100, padding: '9px 22px', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      )}

      {/* ── Segments ── */}
      {!loading && !error && segments.map((segment, segIdx) => {
        const segConfirmed = confirmed[segment.location];
        return (
          <div key={segment.location} style={{ marginBottom: segIdx < segments.length - 1 ? 36 : 0 }}>

            {/* City heading */}
            {segments.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <h3 style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 16,
                  color: segConfirmed ? '#16A34A' : '#00447B', margin: 0,
                }}>
                  🏙️ {segment.location}
                  {segment.dayRange[1] > segment.dayRange[0] && (
                    <span style={{ fontWeight: 500, color: '#6C6D6F', fontSize: 14, marginLeft: 8 }}>
                      · {segment.dayRange[1] - segment.dayRange[0]} night{segment.dayRange[1] - segment.dayRange[0] !== 1 ? 's' : ''}
                    </span>
                  )}
                  {segConfirmed && <span style={{ marginLeft: 8, fontSize: 13, color: '#16A34A' }}>✓</span>}
                </h3>
              </div>
            )}

            {/* Confirmed summary */}
            {segConfirmed && (
              <div style={{ marginBottom: 16 }}>
                <ConfirmedSummary hotel={segConfirmed.hotel} segment={segConfirmed.segment} />
              </div>
            )}

            {/* Horizontal carousel */}
            <HotelCarousel
              hotels={segment.hotels}
              segment={segment}
              segConfirmed={segConfirmed}
              chooseHotel={chooseHotel}
              photoCache={photoCache}
              destination={segment.location || destination}
            />
          </div>
        );
      })}

      {/* ── Give me more options ── */}
      {!loading && segments.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowFilters(v => !v)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1.5px dashed rgba(0,68,123,0.25)',
              borderRadius: 100, padding: '7px 16px', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12, color: '#00447B',
            }}>
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
                  <button key={f.id} onClick={() => toggleFilter(f.id)} style={{
                    background: active ? '#FF8210' : 'rgba(255,130,16,0.07)',
                    color: active ? '#fff' : '#FF8210',
                    border: `1.5px solid ${active ? '#FF8210' : 'rgba(255,130,16,0.30)'}`,
                    borderRadius: 100, padding: '6px 14px',
                    fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{f.label}</button>
                );
              })}
            </div>
          )}

          <button onClick={handleMoreOptions} disabled={loadingMore} style={{
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

      {/* ── All confirmed banner ── */}
      {confirmedCount > 0 && confirmedCount >= totalSegments && totalSegments > 0 && (
        <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#15803D', margin: 0 }}>
            All accommodation confirmed! Your hotels have been added to the itinerary.
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', background: '#15803D', color: '#fff', padding: '12px 22px', borderRadius: 100, fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, boxShadow: '0 6px 24px rgba(0,0,0,0.20)', zIndex: 9999, whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease both' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
