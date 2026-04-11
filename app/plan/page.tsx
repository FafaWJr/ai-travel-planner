'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EditableItinerary, { type ItineraryHandle, type Day } from '@/components/EditableItinerary';
import { BOOKING_AFFILIATE } from '@/lib/affiliate';
import FloatingChat, { type TripUpdate } from '@/components/FloatingChat';
import Toast from '@/components/Toast';
import StayTab, { type AcceptedHotel, type Hotel, type LocationSegment } from '@/components/StayTab';
import BudgetTab from '@/components/BudgetTab';
import NavBar from '@/components/NavBar';
import GateOverlay from '@/components/GateOverlay';
import ReadyToBook from '@/components/ReadyToBook';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { trackTripPlanGenerated, trackChatMessageSent } from '@/lib/analytics';
import { generateTripPDF } from '@/lib/generateTripPDF';
import UnsavedChangesModal from '@/components/UnsavedChangesModal';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
const SLOTS_LIST: { key: TimeSlot; label: string; icon: string }[] = [
  { key: 'morning',   label: 'Morning',   icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️'  },
  { key: 'evening',   label: 'Evening',   icon: '🌆' },
  { key: 'night',     label: 'Night',     icon: '🌙' },
];

/* Parse "- **Name** — description" markdown list into idea objects */
function parseIdeas(md: string): { name: string; description: string }[] {
  const results: { name: string; description: string }[] = [];
  for (const m of md.matchAll(/^[-*]\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/gm)) {
    results.push({ name: m[1].trim(), description: m[2].trim() });
  }
  return results;
}

/* Single idea card with inline day/slot picker */
function IdeaCard({
  idea,
  days,
  onAdd,
}: {
  idea: { name: string; description: string };
  days: { number: number; title: string }[];
  onAdd: (text: string, dayNum: number, slot: TimeSlot) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selDay, setSelDay] = useState<number>(days[0]?.number ?? 1);
  const [selSlot, setSelSlot] = useState<TimeSlot>('morning');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(`**${idea.name}** — ${idea.description}`, selDay, selSlot);
    setAdded(true);
    setOpen(false);
  };

  return (
    <div style={{
      background: '#fff', border: '1.5px solid rgba(0,68,123,0.10)',
      borderRadius: 14, overflow: 'hidden',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#00447B', margin: '0 0 4px' }}>{idea.name}</p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>{idea.description}</p>
        </div>
        {added ? (
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#16A34A', fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>✓ Added</span>
        ) : (
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: open ? '#FF8210' : 'rgba(255,130,16,0.08)',
              color: open ? '#fff' : '#FF8210',
              border: '1.5px solid rgba(255,130,16,0.35)',
              borderRadius: 100, padding: '5px 14px',
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <span>+</span> Add
          </button>
        )}
      </div>

      {/* Inline day + slot picker */}
      {open && !added && (
        <div style={{ borderTop: '1px solid rgba(0,68,123,0.07)', padding: '12px 16px 14px', background: 'rgba(244,247,251,0.7)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Day selector */}
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: '#00447B', display: 'block', marginBottom: 5 }}>Day</label>
              <select
                value={selDay}
                onChange={e => setSelDay(Number(e.target.value))}
                style={{ width: '100%', border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 8, padding: '7px 10px', fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#333', background: '#fff', outline: 'none' }}
              >
                {days.map(d => (
                  <option key={d.number} value={d.number}>Day {d.number} — {d.title}</option>
                ))}
              </select>
            </div>

            {/* Slot selector */}
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: '#00447B', display: 'block', marginBottom: 5 }}>Time</label>
              <select
                value={selSlot}
                onChange={e => setSelSlot(e.target.value as TimeSlot)}
                style={{ width: '100%', border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 8, padding: '7px 10px', fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#333', background: '#fff', outline: 'none' }}
              >
                {SLOTS_LIST.map(s => (
                  <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAdd}
              style={{
                background: '#FF8210', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 18px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13,
                cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-end',
              }}
            >
              Add to itinerary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SVG icons (flat, navy/orange, no emojis) ── */
const Icon = {
  Overview: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1.5C8 1.5 5 5 5 8s3 6.5 3 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 1.5C8 1.5 11 5 11 8s-3 6.5-3 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M1.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Weather: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v1M8 10v1M3.5 3.5l.7.7M11.8 11.8l.7.7M1 6h1M13 6h1M3.5 8.5l.7-.7M11.8 2.2l.7-.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 11.5a2.5 2.5 0 0 1 0-5h.1A3 3 0 1 1 11 10.5H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  Itinerary: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4.5 10h3M4.5 12.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Stays: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V6l6-4 6 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="5.5" y="9" width="2.5" height="3" rx=".5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="8" y="9" width="2.5" height="3" rx=".5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Transport: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 10V7l2-4h6l2 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M1 10h14v1a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-1z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="4" cy="12.5" r="1" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12.5" r="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Budget: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 4v1.5M8 10.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5.5 9.5s0 1.5 2.5 1.5 2.5-1.5 2.5-1.5-0-1.5-2.5-1.5S5.5 6.5 5.5 6.5 5.5 5 8 5s2.5 1.5 2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Tips: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2a4 4 0 0 1 2 7.46V11H6V9.46A4 4 0 0 1 8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 12h4M6.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 2L7 9M14 2L9.5 14 7 9 2 6.5 14 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
};

const SECTIONS = [
  { id:'overview',      label:'Overview',    Icon: Icon.Overview   },
  { id:'weather',       label:'Weather',     Icon: Icon.Weather    },
  { id:'itinerary',     label:'Itinerary',   Icon: Icon.Itinerary  },
  { id:'accommodation', label:'Stays',       Icon: Icon.Stays      },
  { id:'transport',     label:'Transport',   Icon: Icon.Transport  },
  { id:'budget',        label:'Budget',      Icon: Icon.Budget     },
  { id:'tips',          label:'Tips',        Icon: Icon.Tips       },
];

const SECTION_KEYWORDS: Record<string, string[]> = {
  overview:      ['Destination Overview', 'Overview'],
  weather:       ['Travel Season', 'Weather', 'Season & Weather'],
  itinerary:     ['Itinerary', 'Day-by-Day', 'Personalised Itinerary'],
  accommodation: ['Where to Stay', 'Accommodation', 'Stay'],
  transport:     ['Getting Around', 'Transport', 'Getting there'],
  budget:        ['Budget', 'Cost', 'Estimator'],
  tips:          ['Practical Tips', 'Tips', 'Practical'],
};

/* ── Extract one section from the plan markdown ── */
function extractSection(plan: string, sectionId: string): string {
  if (!plan) return '';

  // Parse all ## sections into an array, stripping emojis from headers for matching
  const allSections: { rawHeader: string; cleanHeader: string; content: string[] }[] = [];
  const lines = plan.split('\n');
  let current: { rawHeader: string; cleanHeader: string; content: string[] } | null = null;

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (current) allSections.push(current);
      const raw = line.replace(/^##\s+/, '').trim();
      // Strip emojis and non-alpha chars (except spaces and &) for matching
      const clean = raw.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
                       .replace(/[^a-zA-Z0-9\s&]/g, ' ')
                       .replace(/\s+/g, ' ').trim().toLowerCase();
      current = { rawHeader: raw, cleanHeader: clean, content: [line] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) allSections.push(current);

  if (allSections.length === 0) return plan;

  const keywords = SECTION_KEYWORDS[sectionId] || [];
  const match = allSections.find(s =>
    keywords.some(k => s.cleanHeader.includes(k.toLowerCase()))
  );

  if (match) return match.content.join('\n').trim();

  // overview fallback: first section or full plan
  if (sectionId === 'overview') return allSections[0]?.content.join('\n').trim() || plan;

  const label = SECTIONS.find(s => s.id === sectionId)?.label || sectionId;
  return `## ${label}\n\n*This section wasn't included in the generated plan. Use the AI chat on the right to ask for ${label.toLowerCase()} details!*`;
}

/* ── Minimal markdown → styled HTML ── */
function inlineMd(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, (_, t) => {
      // Tag bold proper nouns as place hovers (starts with capital, not a label like "Morning:")
      const isPlace = /^[A-Z]/.test(t) && !t.endsWith(':') && !/^(morning|afternoon|evening|night|day\s*\d|note|tip|option|important|total|budget|price|cost|recommended|optional|estimated|approximate|include)/i.test(t);
      if (isPlace) {
        const escaped = t.replace(/"/g, '&quot;');
        return `<strong data-place="${escaped}" style="cursor:pointer;border-bottom:1.5px dashed rgba(0,68,123,0.40);color:#00447B;font-weight:700;transition:color 0.15s">${t}</strong>`;
      }
      return `<strong>${t}</strong>`;
    })
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,68,123,0.07);padding:1px 6px;border-radius:4px;font-size:0.92em;font-family:monospace">$1</code>');
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const parts: string[] = [];
  let inUl = false, inOl = false;

  const closeList = () => {
    if (inUl) { parts.push('</ul>'); inUl = false; }
    if (inOl) { parts.push('</ol>'); inOl = false; }
  };

  const UL_STYLE = `style="margin:10px 0 10px 20px;padding:0;list-style:none"`;
  const OL_STYLE = `style="margin:10px 0 10px 20px;padding:0;list-style:none;counter-reset:li"`;
  const LI_STYLE = `style="position:relative;padding:4px 0 4px 18px;font-size:15px;line-height:1.65;color:#333"`;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^#{4}\s/.test(line)) {
      closeList();
      parts.push(`<h4 style="font-family:'Poppins',sans-serif;font-weight:600;font-size:14px;color:#00447B;text-transform:uppercase;letter-spacing:.5px;margin:20px 0 6px">${inlineMd(line.replace(/^#{4}\s+/, ''))}</h4>`);
    } else if (/^#{3}\s/.test(line)) {
      closeList();
      const h3Text = line.replace(/^#{3}\s+/, '');
      const isDay = /^day\s+\d+/i.test(h3Text);
      if (isDay) {
        parts.push(`<div style="margin:28px 0 0;padding-top:24px;border-top:2px solid rgba(0,68,123,0.12)"><span style="display:inline-block;background:#00447B;color:#fff;font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;padding:4px 14px;border-radius:100px;margin-bottom:10px">${inlineMd(h3Text)}</span></div>`);
      } else {
        parts.push(`<h3 style="font-family:'Poppins',sans-serif;font-weight:600;font-size:17px;color:#111;margin:24px 0 8px">${inlineMd(h3Text)}</h3>`);
      }
    } else if (/^#{2}\s/.test(line)) {
      closeList();
      parts.push(`<h2 style="font-family:'Poppins',sans-serif;font-weight:700;font-size:22px;color:#00447B;margin:32px 0 14px;padding-bottom:10px;border-bottom:2px solid rgba(0,68,123,0.10)">${inlineMd(line.replace(/^#{2}\s+/, ''))}</h2>`);
    } else if (/^[-*•]\s/.test(line)) {
      if (!inUl) { closeList(); parts.push(`<ul ${UL_STYLE}>`); inUl = true; }
      parts.push(`<li ${LI_STYLE}><span style="position:absolute;left:0;top:10px;width:6px;height:6px;border-radius:50%;background:#FF8210;display:inline-block"></span>${inlineMd(line.replace(/^[-*•]\s+/, ''))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (!inOl) { closeList(); parts.push(`<ol ${OL_STYLE}>`); inOl = true; }
      parts.push(`<li ${LI_STYLE} style="position:relative;padding:4px 0 4px 28px;font-size:15px;line-height:1.65;color:#333"><span style="position:absolute;left:0;top:5px;width:20px;height:20px;border-radius:50%;background:#00447B;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif">${line.match(/^\d+/)![0]}</span>${inlineMd(line.replace(/^\d+\.\s+/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeList();
      parts.push('<div style="height:6px"></div>');
    } else {
      closeList();
      const dayBold = line.match(/^\*\*(Day\s+\d+[^*]*)\*\*/i);
      if (dayBold) {
        parts.push(`<div style="margin:28px 0 0;padding-top:24px;border-top:2px solid rgba(0,68,123,0.12)"><span style="display:inline-block;background:#00447B;color:#fff;font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;padding:4px 14px;border-radius:100px;margin-bottom:10px">${dayBold[1]}</span></div>`);
      } else {
        parts.push(`<p style="font-size:15px;line-height:1.75;color:#333;margin:4px 0">${inlineMd(line)}</p>`);
      }
    }
  }
  closeList();
  // Remove leading empty spacer if first child
  return parts.join('').replace(/^(<div style="height:6px"><\/div>)+/, '');
}

/* ── Main component ── */
function PlanContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const prompt       = searchParams.get('prompt') || '';
  const tripId       = searchParams.get('tripId');

  const [plan,         setPlan]         = useState('');
  const [loading,      setLoading]      = useState(() => {
    if (typeof window === 'undefined') return false;
    if (searchParams.get('tripId')) return true;
    return !!localStorage.getItem('guest_trip_draft');
  });
  const [error,        setError]        = useState('');
  const [activeSection,setActiveSection] = useState('overview');
  const [photos,       setPhotos]       = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [extraIdeas,      setExtraIdeas]      = useState('');
  const [extraIdeasLoading, setExtraIdeasLoading] = useState(false);
  const [showExtraIdeas,  setShowExtraIdeas]  = useState(false);
  const [toast,           setToast]           = useState<string | null>(null);
  const [acceptedHotels,  setAcceptedHotels]  = useState<AcceptedHotel[]>([]);
  const [seenIdeaNames,   setSeenIdeaNames]   = useState<string[]>([]);
  const [itineraryVersion, setItineraryVersion] = useState(0);
  const itineraryRef = useRef<ItineraryHandle>(null);

  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [gateOpen,    setGateOpen]    = useState(false);
  const [gateFeature, setGateFeature] = useState<string | undefined>(undefined);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [unsavedModal, setUnsavedModal] = useState<{ isOpen: boolean; pendingDestination: string; pendingType: 'link' | 'popstate'; isSaving: boolean }>({ isOpen: false, pendingDestination: '', pendingType: 'link', isSaving: false });
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string; planUpdated?: boolean; isWelcome?: boolean }[]>([]);
  const chatSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markDirty = () => setIsDirty(true);

  // True for both unsaved new trips and edited saved trips
  const hasUnsavedChanges = isDirty || (!!plan && !savedTripId);

  const { releaseGuard } = useUnsavedChangesGuard({
    hasUnsavedChanges,
    onNavigationAttempt: (destination: string, type: 'link' | 'popstate') => {
      setUnsavedModal({ isOpen: true, pendingDestination: destination, pendingType: type, isSaving: false });
    },
  });

  const handleModalSaveAndLeave = async () => {
    setUnsavedModal(prev => ({ ...prev, isSaving: true }));
    const success = await saveTrip();
    if (success) {
      const { pendingDestination, pendingType } = unsavedModal;
      releaseGuard(); // synchronously clears ref BEFORE window.location.href fires beforeunload
      setIsDirty(false);
      setUnsavedModal({ isOpen: false, pendingDestination: '', pendingType: 'link', isSaving: false });
      if (pendingType === 'popstate') {
        window.history.back();
      } else {
        window.location.href = pendingDestination;
      }
    } else {
      setUnsavedModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleModalLeaveWithoutSaving = () => {
    const { pendingDestination, pendingType } = unsavedModal;
    releaseGuard(); // synchronously clears ref BEFORE window.location.href fires beforeunload
    setIsDirty(false);
    setUnsavedModal({ isOpen: false, pendingDestination: '', pendingType: 'link', isSaving: false });
    if (pendingType === 'popstate') {
      window.history.back();
    } else {
      window.location.href = pendingDestination;
    }
  };

  const handleModalStay = () => {
    setUnsavedModal({ isOpen: false, pendingDestination: '', pendingType: 'link', isSaving: false });
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [initialItineraryDays, setInitialItineraryDays] = useState<Day[] | undefined>(undefined);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openGate = (feature?: string) => {
    if (plan) {
      try {
        const snapshot = itineraryRef.current?.getDaysSnapshot();
        localStorage.setItem('guest_trip_draft', JSON.stringify({
          prompt, plan, photos, acceptedHotels,
          itineraryDays: snapshot ?? [],
        }));
      } catch {}
    }
    setGateFeature(feature);
    setGateOpen(true);
  };

  const buildTripPayload = () => {
    const dest = prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,5).join(' ');
    const ciM = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
    const coM = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
    const sd = ciM?.[1] ?? null;
    const ed = coM?.[1] ?? null;
    const numDays = sd && ed ? Math.round((new Date(ed).getTime() - new Date(sd).getTime()) / 86400000) : null;
    const title = `${dest}${numDays ? ` · ${numDays} days` : ''}`;
    const snapshot = itineraryRef.current?.getDaysSnapshot() ?? [];
    const trip_data = { plan, photos, acceptedHotels, prompt, itineraryDays: snapshot };
    return { dest, sd, ed, title, trip_data };
  };

  const saveTrip = async (): Promise<boolean> => {
    if (!user) { openGate('Save trip'); return false; }
    setSaveLoading(true);
    try {
      const { dest, sd, ed, title, trip_data } = buildTripPayload();
      if (savedTripId) {
        const res = await fetch('/api/trips', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedTripId, title, trip_data, chat_history: chatMessages }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      } else {
        const res = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, destination: dest, start_date: sd, end_date: ed, trip_data, chat_history: chatMessages }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
        const json = await res.json();
        if (json.id) setSavedTripId(json.id);
      }
      setIsDirty(false);
      setToast(savedTripId ? 'Trip updated! ✓' : 'Trip saved! ✓');
      return true;
    } catch (err) {
      console.error('[saveTrip] error:', err);
      setToast('Could not save trip. Please try again.');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!user) { openGate('Print / Save PDF'); return; }
    setIsExportingPDF(true);
    try {
      const ciM = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
      const coM = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
      const dest = prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,5).join(' ');
      const days = itineraryRef.current?.getDaysSnapshot() ?? [];
      await generateTripPDF({
        destination: dest,
        startDate: ciM?.[1],
        endDate: coM?.[1],
        itinerary: days.map(d => ({
          day: d.number,
          title: d.title,
          activities: d.activities
            .filter(a => a.status !== 'declined')
            .map(a => ({ name: a.text.replace(/\*\*/g, '') })),
        })),
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const liveActivitiesText = React.useMemo(() => {
    const days = itineraryRef.current?.getDaysSnapshot() ?? [];
    return days
      .flatMap(d => d.activities.filter(a => a.status !== 'declined').map(a => `Day ${d.number}: ${a.text.replace(/\*\*/g, '')}`))
      .join('\n');
  }, [itineraryVersion]); // eslint-disable-line

  // Place photo popup
  const [popup, setPopup] = useState<{ name:string; x:number; y:number } | null>(null);
  const [photoCache, setPhotoCache] = useState<Record<string, string | null | '__loading__'>>({});
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normal generation — skip if we have a tripId or a pending guest draft
  useEffect(() => {
    if (tripId) return;
    if (typeof window !== 'undefined' && localStorage.getItem('guest_trip_draft')) return;
    if (prompt) generatePlan(prompt);
  }, []); // eslint-disable-line

  // Handle tripId (load saved trip) and guest draft restoration — wait for auth to settle first
  useEffect(() => {
    if (authLoading) return;

    const draftStr = typeof window !== 'undefined' ? localStorage.getItem('guest_trip_draft') : null;

    // Restore guest draft after login
    if (draftStr && user && !plan) {
      try {
        const draft = JSON.parse(draftStr) as { prompt: string; plan: string; photos: string[]; acceptedHotels: AcceptedHotel[]; itineraryDays: Day[] };
        setInitialItineraryDays(draft.itineraryDays || []);
        setPlan(draft.plan || '');
        setPhotos(draft.photos || []);
        setAcceptedHotels(draft.acceptedHotels || []);
        setLoading(false);
        localStorage.removeItem('guest_trip_draft');
        saveRestoredDraft(draft);
      } catch {
        localStorage.removeItem('guest_trip_draft');
        if (prompt && !plan) generatePlan(prompt);
      }
      return;
    }

    // Load saved trip by ID
    if (tripId && !plan) {
      loadSavedTripById(tripId);
      return;
    }

    // Draft existed but user isn't logged in — discard it and generate normally
    if (draftStr && !user && !plan) {
      localStorage.removeItem('guest_trip_draft');
      if (prompt) generatePlan(prompt);
    }
  }, [user, authLoading]); // eslint-disable-line

  const loadSavedTripById = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await supabase.from('saved_trips').select('*').eq('id', id).single();
      if (data && data.trip_data) {
        const td = data.trip_data as { plan?: string; photos?: string[]; acceptedHotels?: AcceptedHotel[]; itineraryDays?: Day[] };
        setPlan(td.plan || '');
        setPhotos(td.photos || []);
        setAcceptedHotels((td.acceptedHotels as AcceptedHotel[]) || []);
        if (td.itineraryDays && td.itineraryDays.length > 0) {
          setInitialItineraryDays(td.itineraryDays);
        }
        // Restore chat history if available
        if (Array.isArray(data.chat_history) && data.chat_history.length > 0) {
          setChatMessages(data.chat_history as { role: 'user' | 'assistant'; content: string; planUpdated?: boolean; isWelcome?: boolean }[]);
        }
        setSavedTripId(data.id as string);
      } else {
        setError('Could not load saved trip.');
      }
    } catch {
      setError('Failed to load saved trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveRestoredDraft = async (draft: { prompt: string; plan: string; photos: string[]; acceptedHotels: AcceptedHotel[]; itineraryDays: Day[] }) => {
    if (!user) return;
    try {
      const p = draft.prompt;
      const dest = p.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,5).join(' ');
      const ciM = p.match(/from (\d{4}-\d{2}-\d{2})/);
      const coM = p.match(/to (\d{4}-\d{2}-\d{2})/);
      const sd = ciM?.[1] ?? null;
      const ed = coM?.[1] ?? null;
      const numDays = sd && ed ? Math.round((new Date(ed).getTime() - new Date(sd).getTime()) / 86400000) : null;
      const title = `${dest}${numDays ? ` · ${numDays} days` : ''}`;
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, destination: dest, start_date: sd, end_date: ed,
          trip_data: { plan: draft.plan, photos: draft.photos, acceptedHotels: draft.acceptedHotels, prompt: p, itineraryDays: draft.itineraryDays },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      const json = await res.json();
      if (json.id) setSavedTripId(json.id);
      setToast('Your trip has been saved! ✓');
    } catch (err) {
      console.error('[saveRestoredDraft] error:', err);
    }
  };

  // Auto-save on itinerary changes (only for trips already saved to Supabase)
  useEffect(() => {
    if (!user || !savedTripId || !plan) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const { title, trip_data } = buildTripPayload();
      await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: savedTripId, title, trip_data }),
      });
    }, 2500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [itineraryVersion]); // eslint-disable-line

  // Auto-sync chat history when messages change (debounced, only when trip is saved)
  useEffect(() => {
    if (!user || !savedTripId || chatMessages.length === 0) return;
    if (chatSyncTimer.current) clearTimeout(chatSyncTimer.current);
    chatSyncTimer.current = setTimeout(async () => {
      await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: savedTripId, chat_history: chatMessages }),
      });
    }, 2000);
    return () => { if (chatSyncTimer.current) clearTimeout(chatSyncTimer.current); };
  }, [chatMessages]); // eslint-disable-line

  const generatePlan = async (p: string) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:p}) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPlan(data.plan || data.content || '');
      setIsDirty(true); // new trip exists but hasn't been saved yet
      const dest = p.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)/i,'').trim().split(' ').slice(0,5).join(' ');
      trackTripPlanGenerated(dest);
      setIsLoadingPhotos(true);
      try {
        const pr = await fetch(`/api/destination-photos?city=${encodeURIComponent(dest)}`);
        if (pr.ok) { const pd = await pr.json(); setPhotos(pd.photos||[]); }
      } catch {}
      finally { setIsLoadingPhotos(false); }
    } catch { setError('Failed to generate your travel plan. Please try again.'); }
    finally  { setLoading(false); }
  };

  const handlePlaceMouseOver = async (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-place]') as HTMLElement | null;
    if (!el) return;
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    const name = el.getAttribute('data-place')!;
    const rect = el.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 300);
    const y = rect.bottom + 8;
    setPopup({ name, x, y });
    if (!(name in photoCache)) {
      setPhotoCache(c => ({ ...c, [name]: '__loading__' }));
      try {
        const res  = await fetch(`/api/place-photo?q=${encodeURIComponent(name)}`);
        const data = await res.json();
        setPhotoCache(c => ({ ...c, [name]: data.url || null }));
      } catch {
        setPhotoCache(c => ({ ...c, [name]: null }));
      }
    }
  };

  const handlePlaneMouseLeave = () => {
    hideTimer.current = setTimeout(() => setPopup(null), 120);
  };

  const fetchExtraIdeas = async () => {
    if (extraIdeasLoading) return;
    setExtraIdeasLoading(true);
    try {
      const days = itineraryRef.current?.getDaysSnapshot() ?? [];
      const existingActivities = days.flatMap(d =>
        d.activities.map(a => a.text.replace(/\*\*/g, '').replace(/^\s*[-*]\s*/, '').trim())
      );
      const itineraryContext = days
        .map(d => `Day ${d.number} (${d.title}):\n${d.activities.filter(a => a.status !== 'declined').map(a => `  - ${a.text.replace(/\*\*/g, '').replace(/^\s*[-*]\s*/, '').trim()}`).join('\n')}`)
        .join('\n\n');
      const res = await fetch('/api/extra-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, existingActivities, seenIdeas: seenIdeaNames, itineraryContext }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const newIdeas = parseIdeas(data.ideas || '');
      setSeenIdeaNames(prev => [...new Set([...prev, ...newIdeas.map(i => i.name.toLowerCase())])]);
      setExtraIdeas(data.ideas || '');
    } catch {
      setExtraIdeas('Sorry, could not load extra ideas. Please try again.');
    } finally {
      setExtraIdeasLoading(false);
    }
  };

  const handleExtraIdeas = () => {
    setShowExtraIdeas(v => !v);
    fetchExtraIdeas();
  };

  const sectionContent = plan ? extractSection(plan, activeSection) : '';

  return (
    <div style={{ background:'#F4F7FB', minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>

      {/* ── Nav ── */}
      <NavBar />

      <div style={{ paddingTop:68 }}>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'calc(100vh - 68px)', gap:28 }}>
            <div style={{ position:'relative', width:72, height:72 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.10)', borderTop:'3px solid #FF8210', animation:'spin 1s linear infinite' }} />
              <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:'2px solid rgba(0,68,123,0.06)', borderBottom:'2px solid rgba(0,68,123,0.30)', animation:'spin 1.5s linear infinite reverse' }} />
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:22, color:'#00447B', marginBottom:8 }}>Crafting your perfect trip...</p>
              <p style={{ fontFamily:"'Inter',sans-serif", color:'#6C6D6F', fontSize:15 }}>This usually takes about 30 seconds</p>
            </div>
            <div className="plan-loading-steps" style={{ display:'flex', gap:8 }}>
              {['Researching destination','Building itinerary','Adding local tips'].map((s,i) => (
                <div key={s} style={{ background:'#fff', border:'1px solid rgba(0,68,123,0.10)', borderRadius:100, padding:'6px 14px', fontFamily:"'Inter',sans-serif", fontSize:12, color:'#6C6D6F', animation:`fadeIn 0.5s ${i*0.3}s both` }}>{s}...</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'calc(100vh - 68px)', gap:16, textAlign:'center', padding:'0 24px' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,130,16,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8v4M12 16h.01" stroke="#FF8210" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke="#FF8210" strokeWidth="2"/></svg>
            </div>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:18, color:'#000' }}>{error}</p>
            <button onClick={()=>generatePlan(prompt)} style={{ background:'#FF8210', color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:600, padding:'12px 28px', borderRadius:100, fontSize:14, cursor:'pointer', border:'none' }}>
              Try again
            </button>
          </div>
        )}

        {/* ── Plan ── */}
        {!loading && !error && plan && (
          <>
          <div className="plan-wrapper" style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>

            {/* Left column */}
            <div style={{ minWidth:0 }}>

              {/* Photo strip */}
              {(isLoadingPhotos || photos.length > 0) && (
                <div className="plan-photo-strip" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:6, borderRadius:16, overflow:'hidden', marginBottom:24, height:240 }}>
                  {isLoadingPhotos
                    ? [0,1,2].map(i => (
                        <div key={i} style={{ width:'100%', height:'100%', background: i === 0 ? 'linear-gradient(135deg,#00447B 0%,#679AC1 100%)' : 'linear-gradient(135deg,#679AC1 0%,#A8C8E8 100%)', animation:'photoPulse 1.5s ease-in-out infinite', animationDelay:`${i * 0.2}s` }} />
                      ))
                    : photos.slice(0,3).map((url,i) => (
                        <img key={i} src={url} alt="" loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      ))
                  }
                </div>
              )}

              {/* Destination title + action buttons */}
              {(() => {
                const ciM = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
                const coM = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
                const sd = ciM?.[1]; const ed = coM?.[1];
                const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
                const numDays = sd && ed ? Math.round((new Date(ed).getTime() - new Date(sd).getTime()) / 86400000) : null;
                const destination = prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)/i,'').trim().split(' ').slice(0,5).join(' ');
                return (
                  <div style={{ marginBottom:20, display:'flex', borderRadius:16, border:'1px solid #E5E7EB', background:'#fff', overflow:'hidden' }}>
                    {/* Orange accent bar */}
                    <div style={{ width:5, flexShrink:0, background:'#FF8210', borderRadius:'16px 0 0 16px' }} />
                    {/* Content */}
                    <div style={{ flex:1, padding:'20px 24px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                      <div>
                        {/* Destination + duration badge */}
                        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom: sd && ed ? 10 : 0 }}>
                          <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:28, color:'#00447B', margin:0, lineHeight:1.2 }}>
                            {destination}
                          </p>
                          {numDays !== null && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#FFF4EA', color:'#CC6200', border:'1px solid #FFD0A0', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:600, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {numDays} {numDays === 1 ? 'day' : 'days'} trip
                            </span>
                          )}
                        </div>
                        {/* Date pills */}
                        {sd && ed && (
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#EEF4FB', color:'#00447B', borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:500, fontFamily:"'Inter',sans-serif" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              {fmt(sd)}
                            </span>
                            <span style={{ color:'#9CA3AF', fontSize:14 }}>→</span>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#EEF4FB', color:'#00447B', borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:500, fontFamily:"'Inter',sans-serif" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              {fmt(ed)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    style={{ background:'none', border:'1.5px solid rgba(0,68,123,0.20)', color:'#00447B', fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:13, padding:'7px 16px', borderRadius:100, cursor: isExportingPDF ? 'default' : 'pointer', opacity: isExportingPDF ? 0.7 : 1 }}
                  >
                    {isExportingPDF ? 'Generating PDF…' : 'Export PDF'}
                  </button>
                  <button
                    onClick={saveTrip}
                    disabled={saveLoading || (!!savedTripId && !isDirty)}
                    style={{ background: saveLoading ? 'rgba(255,130,16,0.6)' : (savedTripId && !isDirty) ? '#16A34A' : '#FF8210', color:'#fff', border:'none', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, padding:'8px 20px', borderRadius:100, cursor: (saveLoading || (!!savedTripId && !isDirty)) ? 'default' : 'pointer', transition:'background 0.15s' }}
                  >
                    {saveLoading ? 'Saving…' : (savedTripId && !isDirty) ? '✓ Saved' : savedTripId ? 'Save changes' : 'Save trip'}
                  </button>
                  <button onClick={()=>router.push('/')} style={{ background:'#00447B', color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, padding:'8px 20px', borderRadius:100, cursor:'pointer', border:'none' }}>
                    New trip
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

              {/* Section tabs — folder-tab style */}
              <div className="plan-tabs" style={{ display:'flex', overflowX:'auto', marginBottom:0, borderBottom:'2px solid rgba(0,68,123,0.10)' }}>
                {SECTIONS.map(s => {
                  const active = activeSection === s.id;
                  return (
                    <button key={s.id} onClick={() => {
                      if (!user && (s.id === 'accommodation' || s.id === 'budget')) {
                        openGate(s.id === 'accommodation' ? 'Hotel suggestions' : 'Budget estimator');
                      } else {
                        setActiveSection(s.id);
                      }
                    }} style={{
                      display:'flex', alignItems:'center', gap:6, padding:'10px 18px',
                      borderRadius:'8px 8px 0 0',
                      border: active ? '1.5px solid rgba(0,68,123,0.10)' : 'none',
                      borderBottom: active ? '2px solid #fff' : 'none',
                      marginBottom: active ? -2 : 0,
                      background: active ? '#fff' : 'transparent',
                      color: active ? '#FF8210' : '#6C6D6F',
                      fontFamily:"'Poppins',sans-serif", fontWeight: active ? 600 : 500, fontSize:13,
                      cursor:'pointer', whiteSpace:'nowrap', transition:'color 0.15s, background 0.15s', flexShrink:0,
                    }}>
                      <s.Icon /> {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Rendered plan section */}
              {/* EditableItinerary always stays mounted to preserve user changes */}
              <div style={{ display: activeSection === 'itinerary' ? 'block' : 'none' }}>
                <EditableItinerary
                  ref={itineraryRef}
                  itineraryMd={extractSection(plan, 'itinerary')}
                  destination={prompt.replace(/^plan a (trip to |)?/i,'').split(/\s+/).slice(0,4).join(' ')}
                  tripPrompt={prompt}
                  photos={photos}
                  acceptedHotels={acceptedHotels}
                  onActivityStatusChange={() => { setItineraryVersion(v => v + 1); markDirty(); }}
                  onPlaceHover={handlePlaceMouseOver}
                  onPlaceLeave={handlePlaneMouseLeave}
                  isGuest={!user}
                  onGateRequired={() => openGate('Show me more ideas')}
                  initialDays={initialItineraryDays}
                  startDate={prompt.match(/from (\d{4}-\d{2}-\d{2})/)?.[1]}
                />
              </div>
              {/* StayTab — always mounted to preserve state, hidden when not active */}
              {(() => {
                const ciMatch = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
                const coMatch = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
                const stayDest = prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,5).join(' ');
                const stayBudget = /luxury/i.test(prompt) ? 'luxury' : /premium/i.test(prompt) ? 'premium' : /budget/i.test(prompt) ? 'budget' : 'comfortable';
                return (
                  <div style={{ display: activeSection === 'accommodation' ? 'block' : 'none' }}>
                    <StayTab
                      prompt={prompt}
                      destination={stayDest}
                      checkIn={ciMatch?.[1] || ''}
                      checkOut={coMatch?.[1] || ''}
                      budget={stayBudget}
                      itineraryRef={itineraryRef}
                      onAddToItinerary={(text, dayNum, slot) => {
                        setActiveSection('itinerary');
                        itineraryRef.current?.addActivity(text, dayNum, slot, true);
                        setToast(text.replace(/\*\*/g, '').slice(0, 60));
                      }}
                      onRemoveActivitiesMatching={(pattern) => {
                        itineraryRef.current?.removeActivitiesMatching(pattern);
                      }}
                      externalAccepted={acceptedHotels}
                      onHotelsConfirmed={(hotels) => { setAcceptedHotels(hotels); markDirty(); }}
                    />
                  </div>
                );
              })()}
              {/* BudgetTab — always mounted to preserve state */}
              <div style={{ display: activeSection === 'budget' ? 'block' : 'none' }}>
                <BudgetTab
                  itineraryRef={itineraryRef}
                  acceptedHotels={acceptedHotels}
                  prompt={prompt}
                  version={itineraryVersion}
                />
              </div>
              {activeSection !== 'itinerary' && activeSection !== 'accommodation' && activeSection !== 'budget' && (
                <div className="plan-section" style={{ background:'#fff', borderRadius:'0 0 16px 16px', padding:'32px 36px', boxShadow:'0 2px 20px rgba(0,68,123,0.07)', border:'1px solid rgba(0,68,123,0.08)', borderTop:'none' }}>
                  <div
                    onMouseOver={handlePlaceMouseOver}
                    onMouseLeave={handlePlaneMouseLeave}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(sectionContent) }}
                  />
                </div>
              )}

              {/* Section navigation */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
                {(() => {
                  const idx = SECTIONS.findIndex(s=>s.id===activeSection);
                  const prev = SECTIONS[idx-1]; const next = SECTIONS[idx+1];
                  return <>
                    {prev ? (
                      <button onClick={()=>setActiveSection(prev.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1.5px solid rgba(0,68,123,0.15)', color:'#00447B', fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:13, padding:'8px 16px', borderRadius:100, cursor:'pointer' }}>
                        ← {prev.label}
                      </button>
                    ) : <div />}
                    {next && (
                      <button onClick={()=>setActiveSection(next.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'#00447B', border:'none', color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, padding:'8px 18px', borderRadius:100, cursor:'pointer' }}>
                        {next.label} →
                      </button>
                    )}
                  </>;
                })()}
              </div>

              {/* ── Extra Ideas ── */}
              {activeSection === 'itinerary' && (
              <div style={{ marginTop:20 }}>
                <button
                  onClick={() => user ? handleExtraIdeas() : openGate('Show more ideas')}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    background:'none', border:'1.5px dashed rgba(255,130,16,0.55)',
                    borderRadius:100, padding:'9px 20px', cursor:'pointer',
                    fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13,
                    color:'#FF8210', transition:'all 0.15s',
                  }}
                  onMouseEnter={e=>{(e.currentTarget).style.background='rgba(255,130,16,0.06)';}}
                  onMouseLeave={e=>{(e.currentTarget).style.background='none';}}
                >
                  <span style={{ fontSize:16 }}>✨</span>
                  {showExtraIdeas ? 'Hide extra ideas' : 'Show me more ideas'}
                  <span style={{ fontSize:12, transition:'transform 0.2s', transform: showExtraIdeas ? 'rotate(180deg)' : 'rotate(0deg)', display:'inline-block' }}>▾</span>
                </button>

                {showExtraIdeas && (
                  <div style={{ marginTop:12, background:'#fff', borderRadius:14, border:'1.5px solid rgba(0,68,123,0.08)', boxShadow:'0 2px 16px rgba(0,68,123,0.06)', animation:'fadeIn 0.2s ease both' }}>
                    <div style={{ padding:'18px 24px 6px', borderBottom:'1px solid rgba(0,68,123,0.07)', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>💡</span>
                      <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:'#00447B' }}>A few more ideas for your trip</p>
                    </div>
                    <div style={{ padding:'16px 24px 20px' }}>
                      {extraIdeasLoading ? (
                        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0' }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', border:'2.5px solid rgba(0,68,123,0.10)', borderTop:'2.5px solid #FF8210', animation:'spin 0.9s linear infinite', flexShrink:0 }} />
                          <p style={{ fontFamily:"'Inter',sans-serif", color:'#9CA3AF', fontSize:13 }}>Looking for extra ideas...</p>
                        </div>
                      ) : (() => {
                        const ideas = parseIdeas(extraIdeas);
                        const days = itineraryRef.current?.getDays() ?? [];
                        if (ideas.length === 0) return <div dangerouslySetInnerHTML={{ __html: markdownToHtml(extraIdeas) }} />;
                        return (
                          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {ideas.map((idea, i) => (
                              <IdeaCard
                                key={i}
                                idea={idea}
                                days={days.length > 0 ? days : [{ number: 1, title: 'Day 1' }]}
                                onAdd={(text, dayNum, slot) => {
                                  setActiveSection('itinerary');
                                  itineraryRef.current?.addActivity(text, dayNum, slot, true);
                                  setToast(`"${idea.name}" added to Day ${dayNum}`);
                                }}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* ── Affiliate booking links ── */}
              {(() => {
                const dest = prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,4).join(' ');
                return <ReadyToBook destination={dest} />;
              })()}

            </div>
          </div>

          {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

          <FloatingChat
            plan={plan}
            destination={prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,5).join(' ')}
            hotelContext={acceptedHotels.length > 0
              ? acceptedHotels.map(({ hotel, segment }) =>
                  `The user has confirmed their stay at ${hotel.name} (${hotel.stars}★, ${hotel.neighborhood}) for ${segment.label}. Price: ${hotel.priceRange}. Amenities: ${hotel.amenities.join(', ')}.`
                ).join('\n')
              : undefined
            }
            currentActivities={liveActivitiesText}
            onAddToItinerary={(text, dayNum, slot) => {
              setActiveSection('itinerary');
              itineraryRef.current?.addActivity(text, dayNum, slot, true);
              setToast(`Activity added to Day ${dayNum}`);
            }}
            onPlanUpdate={(updatedPlan) => {
              setPlan(updatedPlan);
              setItineraryVersion(v => v + 1);
              markDirty();
            }}
            onTripUpdate={(update: TripUpdate) => {
              if (update.type === 'add_activity') {
                const dayNum = update.day ?? 1;
                const slot = (update.timeSlot?.toLowerCase() ?? 'afternoon') as TimeSlot;
                const text = update.activity || update.location || 'Activity';
                itineraryRef.current?.addActivity(text, dayNum, slot, false, true);
                setToast(`Added to Day ${dayNum}`);
                markDirty();
                return;
              }
              if (update.type === 'remove_activity') {
                const dayNum = update.day ?? 1;
                const text = update.activity || update.location || '';
                if (text) itineraryRef.current?.removeActivitiesMatching(text);
                setToast(`Activity removed from Day ${dayNum}`);
                markDirty();
                return;
              }
              if (update.type === 'stays') {
                const d = update.data;
                if (!d?.hotelName) return;

                // Derive actual dates from day numbers + trip start date
                const startMatch = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
                const endMatch = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
                const tripStart = startMatch ? new Date(startMatch[1] + 'T12:00:00') : null;
                const tripEnd = endMatch ? new Date(endMatch[1] + 'T12:00:00') : null;
                const totalDays = tripStart && tripEnd
                  ? Math.round((tripEnd.getTime() - tripStart.getTime()) / 86400000) + 1
                  : null;

                const dayToDate = (dayNum: number): string => {
                  if (!tripStart) return `Day ${dayNum}`;
                  const d = new Date(tripStart);
                  d.setDate(d.getDate() + dayNum - 1);
                  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                };

                const checkInDay = d.checkInDay ?? 1;
                const checkOutDay = d.checkOutDay ?? (totalDays ?? checkInDay + 1);

                if (update.action === 'add' || update.action === 'update') {
                  const hotel: Hotel = {
                    id: `luna-${Date.now()}`,
                    name: d.hotelName,
                    stars: d.stars ?? 3,
                    description: '',
                    priceRange: d.priceRange ?? '',
                    neighborhood: d.neighborhood ?? d.city ?? '',
                    amenities: d.amenities ?? [],
                    googleMapsQuery: `${d.hotelName} ${d.city ?? ''}`.trim(),
                  };
                  const segment: LocationSegment = {
                    location: d.city ?? '',
                    label: d.city ? `${d.city} stay` : 'Stay',
                    checkIn: dayToDate(checkInDay),
                    checkOut: dayToDate(checkOutDay),
                    dayRange: [checkInDay, checkOutDay],
                    hotels: [hotel],
                  };
                  setAcceptedHotels(prev => [
                    ...prev.filter(h => h.hotel.name.toLowerCase() !== d.hotelName!.toLowerCase()),
                    { hotel, segment },
                  ]);
                  // Add hotel as a regular activity card in the Itinerary tab
                  const neighborhood = d.neighborhood ?? d.city ?? '';
                  const hotelLink = `<a href="${BOOKING_AFFILIATE.hotels}" target="_blank" rel="noopener noreferrer sponsored" style="color:#00447B;font-weight:600;text-decoration:underline">${d.hotelName}</a>`;
                  const activityText = `Check-in: ${hotelLink}${neighborhood ? ` (${neighborhood})` : ''}`;
                  itineraryRef.current?.addActivity(activityText, checkInDay, 'morning', false, true);
                  setToast(`${d.hotelName} added to your stays`);
                  markDirty();
                } else if (update.action === 'remove') {
                  setAcceptedHotels(prev => prev.filter(h => h.hotel.name.toLowerCase() !== d.hotelName!.toLowerCase()));
                  itineraryRef.current?.removeActivitiesMatching(d.hotelName);
                  setToast(`${d.hotelName} removed from your stays`);
                  markDirty();
                }
              }
            }}
            isGuest={!user}
            onGateRequired={() => openGate('Luna AI chat')}
            initialMessages={chatMessages.length > 0 ? chatMessages : undefined}
            savedTripId={savedTripId}
            onMessagesChange={setChatMessages}
          />
          {gateOpen && <GateOverlay onClose={() => setGateOpen(false)} tripSnapshot={plan ? { plan, photos, acceptedHotels, itineraryDays: itineraryRef.current?.getDaysSnapshot() ?? [], prompt } : undefined} />}
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && !plan && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 68px)' }}>
            {(tripId || (typeof window !== 'undefined' && !!localStorage.getItem('guest_trip_draft'))) ? (
              <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.12)', borderTop:'3px solid #FF8210', animation:'spin 1s linear infinite' }} />
            ) : (
              <div style={{ textAlign:'center' }}>
                <p style={{ fontFamily:"'Inter',sans-serif", color:'#6C6D6F', fontSize:16, marginBottom:16 }}>No trip prompt provided.</p>
                <button onClick={()=>router.push('/')} style={{ background:'#FF8210', color:'#fff', border:'none', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:14, padding:'12px 28px', borderRadius:100, cursor:'pointer' }}>
                  Start planning
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Place photo popup ── */}
      {popup && (
        <div
          onMouseEnter={() => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } }}
          onMouseLeave={() => setPopup(null)}
          style={{
            position:'fixed', zIndex:9999,
            top: popup.y, left: popup.x,
            width:290,
            background:'#fff', borderRadius:14,
            boxShadow:'0 12px 40px rgba(0,0,0,0.18)',
            border:'1px solid rgba(0,68,123,0.12)',
            overflow:'hidden',
            animation:'popupFadeIn 0.15s ease both',
            pointerEvents:'auto',
          }}
        >
          {/* Photo area */}
          {photoCache[popup.name] === '__loading__' || !(popup.name in photoCache) ? (
            <div style={{ height:160, background:'#F4F7FB', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.10)', borderTop:'3px solid #FF8210', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : photoCache[popup.name] ? (
            <img src={photoCache[popup.name]!} alt={popup.name} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
          ) : (
            <div style={{ height:100, background:'#F4F7FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📍</div>
          )}
          {/* Name */}
          <div style={{ padding:'12px 14px 14px' }}>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:'#00447B', marginBottom:2 }}>{popup.name}</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9CA3AF' }}>Tap to search this place</p>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        isOpen={unsavedModal.isOpen}
        isSaving={unsavedModal.isSaving}
        onSaveAndLeave={handleModalSaveAndLeave}
        onLeaveWithoutSaving={handleModalLeaveWithoutSaving}
        onStay={handleModalStay}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes photoPulse { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
        @keyframes fadeIn     { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes popupFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        [data-place]:hover { color: #FF8210 !important; }
        @media print {
          nav, .no-print { display:none !important; }
          body { background:#fff; }
        }
        @media (max-width: 640px) {
          /* Plan page wrapper */
          .plan-wrapper { padding: 16px 12px !important; }
          /* Photo strip: collapse to single image */
          .plan-photo-strip { grid-template-columns: 1fr !important; height: 180px !important; }
          .plan-photo-strip img:not(:first-child) { display: none !important; }
          /* Section tabs: allow horizontal scroll */
          .plan-tabs { overflow-x: auto !important; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .plan-tabs button { white-space: nowrap; }
          /* Section content padding */
          .plan-section { padding: 20px 16px !important; }
          /* Loading steps: stack vertically */
          .plan-loading-steps { flex-direction: column !important; align-items: center !important; }
          /* Destination header */
          .plan-dest-header { flex-direction: column !important; gap: 12px !important; }
          .plan-dest-actions { flex-wrap: wrap !important; }
        }
      `}</style>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div style={{ background:'#F4F7FB', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.12)', borderTop:'3px solid #FF8210', animation:'spin 1s linear infinite' }} />
        <p style={{ fontFamily:"'Poppins',sans-serif", color:'#00447B', fontSize:15 }}>Loading your plan...</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}
