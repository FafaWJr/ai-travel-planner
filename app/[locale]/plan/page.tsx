'use client';
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import sanitizeHtml from 'sanitize-html';
import { markdownToHtml, extractSection, PLAN_SANITIZE_CONFIG } from '@/lib/plan-render';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import EditableItinerary, { type ItineraryHandle, type Day, type Activity } from '@/components/EditableItinerary';
import type { Phase, TripLengthMode } from '@/types';
import { normalizeDefineDayInput, normalizeDefinePhaseInput, defineDayInputToDay, definePhaseInputToPhase } from '@/lib/normalizeToolInput';
import { applyStage4Rules, parsePromptContext, type TripRulesContext } from '@/lib/ai';
import RegenerationModal from '@/components/RegenerationModal';
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
import { COLLAB_ENABLED, COLLAB_REALTIME_ENABLED, type CollabRole } from '@/lib/collaboration';
import type { Comment, CommentConfig } from '@/lib/comment-types';
import { Share } from 'lucide-react';
import { InviteModal } from '@/components/collab/InviteModal';
import { CollaboratorAvatars } from '@/components/collab/CollaboratorAvatars';
import CollabToast from '@/components/CollabToast';
import { useCollaborativeTrip } from '@/hooks/useCollaborativeTrip';
import type { Patch } from '@/lib/trip-patches';
import {
  readUserChatHistory,
  writeUserChatHistory,
  isKeyedHistory,
  migrateToKeyed,
  type ChatHistory,
} from '@/lib/chat-history';
import { PlaceCacheProvider, usePlaceCache, PlacePreviewCard, PlacePreviewSkeleton } from '@/components/place-preview';
import type { ResolveResponse } from '@/lib/places/types';

/* Map next-intl locale codes to JS Intl locale codes for date formatting */
function toDateLocale(locale: string): string {
  return locale === 'en' ? 'en-GB' : locale;
}

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
  const t = useTranslations('plan');
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
              <label style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: '#00447B', display: 'block', marginBottom: 5 }}>{t('time')}</label>
              <select
                value={selSlot}
                onChange={e => setSelSlot(e.target.value as TimeSlot)}
                style={{ width: '100%', border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 8, padding: '7px 10px', fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#333', background: '#fff', outline: 'none' }}
              >
                {SLOTS_LIST.map(s => (
                  <option key={s.key} value={s.key}>{s.icon} {t(`timeOfDay.${s.key}` as Parameters<typeof t>[0])}</option>
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
              {t('activity.addToItinerary')}
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

/* ── Main component ── */
function PlanContent() {
  const t            = useTranslations('plan');
  const tCollab      = useTranslations('collab.invite');
  const locale       = useLocale();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const placePreviewEnabled = process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED === 'true';
  const { resolve: resolvePlace } = usePlaceCache();
  const sectionLabel = (id: string): string => {
    const map: Record<string, string> = {
      overview:      t('tabs.overview'),
      weather:       t('tabs.weather'),
      itinerary:     t('tabs.itinerary'),
      accommodation: t('tabs.stays'),
      transport:     t('tabs.transport'),
      budget:        t('tabs.budget'),
      tips:          t('tabs.tips'),
    };
    return map[id] ?? id;
  };
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
  // P2-1: toast carries a variant so the R2b refusal renders as an error
  // (red, longer duration) rather than a success (green ✓).
  const [toast, setToastInternal] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const setToast = (message: string | null, variant: 'success' | 'error' = 'success') => {
    setToastInternal(message === null ? null : { message, variant });
  };
  const [acceptedHotels,  setAcceptedHotels]  = useState<AcceptedHotel[]>([]);
  const [seenIdeaNames,   setSeenIdeaNames]   = useState<string[]>([]);
  const [itineraryVersion, setItineraryVersion] = useState(0);
  const [streamedDayCount, setStreamedDayCount] = useState(0);
  const [pendingChatPrompt, setPendingChatPrompt] = useState<{ text: string; nonce: number } | null>(null);
  const [injectedChatMessage, setInjectedChatMessage] = useState<{ content: string; nonce: number } | null>(null);
  const itineraryRef = useRef<ItineraryHandle>(null);

  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [gateOpen,    setGateOpen]    = useState(false);
  const [gateFeature, setGateFeature] = useState<string | undefined>(undefined);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [myRole, setMyRole] = useState<CollabRole | null>(null);
  const [collabIncomingPatch, setCollabIncomingPatch] = useState<Patch | null>(null);
  // Stage 2f hotfix #9: derives the viewer-mode UI lock. The data layer
  // already 403s viewer mutations; this boolean closes the UX gap by
  // hiding edit affordances. Solo trips and editor/owner sessions stay
  // false. Re-evaluates whenever myRole changes.
  const isViewerRole = myRole === 'viewer';

  useEffect(() => {
    if (!COLLAB_ENABLED || !savedTripId) {
      setMyRole(null);
      return;
    }
    (async () => {
      const res = await fetch(`/api/trips/${savedTripId}/collaborators`);
      if (!res.ok) {
        setMyRole(null);
        return;
      }
      const body = await res.json();
      setMyRole(body.currentUserRole ?? null);
    })();
  }, [savedTripId]);

  const [tripIsCollaborative, setTripIsCollaborative] = useState(false);
  const [tripOwnerId, setTripOwnerId] = useState<string | null>(null);

  // Stage 4b: comments state — declared here so fetchComments is available
  // before the collab hook call (hook takes onCommentsChanged: fetchComments).
  const [comments, setComments] = useState<Comment[]>([]);
  const fetchComments = useCallback(async () => {
    if (!savedTripId || !tripIsCollaborative || !COLLAB_ENABLED) return;
    try {
      const res = await fetch(`/api/trips/${savedTripId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch (err) {
      console.error('[comments] fetch failed:', err);
    }
  }, [savedTripId, tripIsCollaborative]);

  // Collab realtime hook. Dual-mode: hook owns state when enabled,
  // passthrough otherwise. Solo trips are unaffected.
  // Stage 2b: presence + subscription only. emitPatch is stubbed.
  // Stage 2d will wire patch emission and application.
  const collabEnabled = Boolean(
    COLLAB_ENABLED &&
    COLLAB_REALTIME_ENABLED &&
    savedTripId &&
    myRole
  );

  const collab = useCollaborativeTrip({
    tripId: savedTripId ?? '',
    enabled: collabEnabled,
    initialTripData: {}, // tripData not hook-managed; EditableItinerary owns day/phase state via ref
    userId: user?.id ?? '',
    userName: user?.user_metadata?.full_name ?? user?.email ?? 'You',
    userRole: myRole ?? 'viewer',
    avatarUrl: user?.user_metadata?.avatar_url ?? null,
    // Stage 2d: wire ref + hotels so received patches can dispatch to
    // the correct handle method or callback.
    itineraryRef,
    onHotelsChange: setAcceptedHotels,
    currentHotels: acceptedHotels,
    onCommentsChanged: fetchComments,
    onIncomingPatch: setCollabIncomingPatch,
  });

  const [savedTripDestination, setSavedTripDestination] = useState<string>('');
  // Stage 2e: hold start/end dates from saved-trip state so the trip
  // header renders correctly for joined collaborators (who open via
  // ?tripId= without a `prompt` URL param).
  const [savedTripStartDate, setSavedTripStartDate] = useState<string>('');
  const [savedTripEndDate, setSavedTripEndDate] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [unsavedModal, setUnsavedModal] = useState<{ isOpen: boolean; pendingDestination: string; pendingType: 'link' | 'popstate'; isSaving: boolean }>({ isOpen: false, pendingDestination: '', pendingType: 'link', isSaving: false });
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string; planUpdated?: boolean; isWelcome?: boolean }[]>([]);
  // Stage 3a: per-user chat threads. fullChatHistory holds the complete keyed
  // object (all users' threads); chatMessages holds only THIS user's flat thread
  // for rendering. Collab-trip saves write the keyed shape; solo trips stay flat.
  const [fullChatHistory, setFullChatHistory] = useState<ChatHistory | null>(null);
  const chatSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markDirty = () => setIsDirty(true);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // When a new collaborator joins the presence channel mid-session, the owner's
  // page may still have tripIsCollaborative=false from initial load. Detect the
  // join via presence growing to >1 and flip the flag so comment icons appear.
  useEffect(() => {
    if (COLLAB_ENABLED && collab.enabled && collab.presence.length > 1 && !tripIsCollaborative) {
      setTripIsCollaborative(true);
    }
  }, [collab.enabled, collab.presence.length, tripIsCollaborative]);

  // R4: Regeneration modal state
  const [regenModal, setRegenModal] = useState<{
    isOpen: boolean;
    mode: 'day' | 'phase';
    dayNumber?: number;
    phaseId?: string;
    phaseName?: string;
    dayRange?: [number, number];
    hasAcceptedActivities: boolean;
    isSubmitting: boolean;
  }>({ isOpen: false, mode: 'day', hasAcceptedActivities: false, isSubmitting: false });

  // ── R4 Regeneration handlers ─────────────────────────────────────────────

  const handleRegenerateDayClick = (dayNumber: number) => {
    const accepted = itineraryRef.current?.getAcceptedActivitiesForDay(dayNumber) ?? [];
    setRegenModal({
      isOpen: true, mode: 'day', dayNumber,
      hasAcceptedActivities: accepted.length > 0, isSubmitting: false,
    });
  };

  const handleRegeneratePhaseClick = (phaseId: string) => {
    const phase = itineraryRef.current?.getPhases().find(p => p.id === phaseId);
    if (!phase) return;
    setRegenModal({
      isOpen: true, mode: 'phase', phaseId,
      phaseName: phase.label, dayRange: [phase.dayFrom, phase.dayTo],
      hasAcceptedActivities: false, isSubmitting: false,
    });
  };

  const handleRegenConfirm = async (opts: { userHint: string; keepAccepted: boolean }) => {
    setRegenModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      if (regenModal.mode === 'day') {
        await executeRegenerateDay(regenModal.dayNumber!, opts);
      } else {
        await executeRegeneratePhase(regenModal.phaseId!, opts);
      }
      setRegenModal({ isOpen: false, mode: 'day', hasAcceptedActivities: false, isSubmitting: false });
    } catch (err) {
      console.error('[regen] failed:', err);
      setToast('Regeneration failed. Please try again.');
      setRegenModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const executeRegenerateDay = async (
    dayNumber: number,
    opts: { userHint: string; keepAccepted: boolean },
  ) => {
    const parsed = parsePromptContext(prompt);

    // Fallback: saved-trip flow has no prompt in URL — use the DB destination field.
    const resolvedDestination = parsed.destination || savedTripDestination ||
      new URLSearchParams(window.location.search).get('destination') || '';
    if (!resolvedDestination) {
      console.error('[regen] no destination resolvable from prompt, state, or URL');
      setToast('Unable to regenerate: destination not found. Please refresh and try again.');
      return;
    }

    const days = itineraryRef.current?.getDaysSnapshot() ?? [];
    const currentDay = days.find(d => d.number === dayNumber);
    const phaseId = currentDay?.phase_id;
    const phase = phaseId ? itineraryRef.current?.getPhases().find(p => p.id === phaseId) : undefined;

    const prevDay = days.find(d => d.number === dayNumber - 1);
    const nextDay = days.find(d => d.number === dayNumber + 1);
    const adjacentDaysSummary = [prevDay, nextDay].filter(Boolean)
      .map(d => `Day ${d!.number} (${d!.title}): ${d!.activities.slice(0, 3).map(a => a.text.replace(/\*\*/g, '').slice(0, 60)).join('; ')}`)
      .join('\n');

    const acceptedActivities = opts.keepAccepted
      ? itineraryRef.current?.getAcceptedActivitiesForDay(dayNumber) ?? []
      : [];

    const adultsMatch = prompt.match(/for (\d+) adult/i);
    const adultsNum = adultsMatch ? parseInt(adultsMatch[1], 10) : undefined;
    const travellers = adultsNum
      ? `${adultsNum} adult${adultsNum > 1 ? 's' : ''}${parsed.children ? ` + ${parsed.children} child${parsed.children > 1 ? 'ren' : ''}` : ''}`
      : undefined;

    const budgetMatch = prompt.match(/with (budget-friendly|comfortable|premium|luxury) budget/i);
    const budgetLevel = budgetMatch ? budgetMatch[1] : undefined;

    const res = await fetch('/api/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayNumber,
        destination: resolvedDestination,
        tripPrompt: prompt,
        currentDayTitle: currentDay?.title,
        phase: phase ? { id: phase.id, label: phase.label, summary: phase.summary } : undefined,
        adjacentDaysSummary: adjacentDaysSummary || undefined,
        travellers,
        travelStyles: parsed.tripStyles,
        budgetLevel,
        adultAges: parsed.adultAges,
        childrenAges: parsed.childrenAges,
        children: parsed.children,
        notes: parsed.notes,
        locale,
        userHint: opts.userHint || undefined,
        mode: opts.keepAccepted ? 'keep-accepted' : 'replace-all',
        acceptedActivities: opts.keepAccepted ? acceptedActivities : undefined,
      }),
    });
    if (!res.ok) throw new Error(await res.text());

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let toolInput: Record<string, unknown> | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const event = JSON.parse(jsonStr);
          if (event?.tool_use?.name === 'define_day') toolInput = event.tool_use.input ?? {};
        } catch { /* skip */ }
      }
    }

    if (!toolInput) throw new Error('No day returned from regeneration');

    const normalized = normalizeDefineDayInput(toolInput);
    if (!normalized) throw new Error('Invalid day data returned');

    const rulesCtx: TripRulesContext = {
      adultAges: parsed.adultAges, childrenAges: parsed.childrenAges,
      children: parsed.children, tripStyles: parsed.tripStyles,
      notes: parsed.notes, destination: parsed.destination,
    };
    const safeInput = applyStage4Rules(normalized as import('@/lib/ai').DefineDayInputForRules, rulesCtx);
    const safeNormalized = {
      ...normalized,
      morning:   (safeInput.morning   ?? normalized.morning)   as string[],
      afternoon: (safeInput.afternoon ?? normalized.afternoon) as string[],
      evening:   (safeInput.evening   ?? normalized.evening)   as string[],
      night:     (safeInput.night     ?? normalized.night)     as string[],
    };

    const newDay = defineDayInputToDay(safeNormalized);
    // Preserve accepted activities if keep-accepted mode
    if (opts.keepAccepted && acceptedActivities.length > 0) {
      for (const acc of acceptedActivities) {
        const existingIdx = newDay.activities.findIndex(
          a => a.slot === acc.timeSlot && a.text.replace(/\*\*/g, '').toLowerCase().includes(acc.text.toLowerCase().slice(0, 30))
        );
        if (existingIdx >= 0) {
          newDay.activities[existingIdx].status = 'accepted';
        }
      }
    }

    itineraryRef.current?.replaceDay(dayNumber, newDay);
    setToast(`Day ${dayNumber} regenerated`);
    markDirty();
    setItineraryVersion(v => v + 1);
  };

  const executeRegeneratePhase = async (
    phaseId: string,
    opts: { userHint: string; keepAccepted: boolean },
  ) => {
    const phase = itineraryRef.current?.getPhases().find(p => p.id === phaseId);
    if (!phase) throw new Error('Phase not found');

    const parsed = parsePromptContext(prompt);
    const resolvedDestination = parsed.destination || savedTripDestination ||
      new URLSearchParams(window.location.search).get('destination') || '';
    const ciM = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
    const coM = prompt.match(/to (\d{4}-\d{2}-\d{2})/);

    const res = await fetch('/api/expand-phase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: { id: phase.id, label: phase.label, day_from: phase.dayFrom, day_to: phase.dayTo, summary: phase.summary, highlights: phase.highlights },
        destination: resolvedDestination,
        startDate: ciM?.[1],
        endDate: coM?.[1],
        travelStyles: parsed.tripStyles,
        adultAges: parsed.adultAges,
        childrenAges: parsed.childrenAges,
        children: parsed.children,
        notes: parsed.notes,
        locale,
        mode: 'regenerate',
        userHint: opts.userHint || undefined,
      }),
    });
    if (!res.ok) throw new Error(await res.text());

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let dayCount = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const event = JSON.parse(jsonStr);
          if (event?.tool_use?.name === 'define_day') {
            const normalized = normalizeDefineDayInput((event.tool_use.input ?? {}) as Record<string, unknown>);
            if (normalized) {
              itineraryRef.current?.setStructuredDay(defineDayInputToDay(normalized));
              dayCount++;
            }
          }
        } catch { /* skip */ }
      }
    }
    if (dayCount === 0) throw new Error('No days returned from phase regeneration');

    const acks = [
      `I just regenerated the "${phase.label}" phase. Take a look at Days ${phase.dayFrom}-${phase.dayTo} and let me know if you want me to tweak anything.`,
      `Fresh take on the "${phase.label}" phase done. Days ${phase.dayFrom} through ${phase.dayTo} have new activities. What do you think?`,
      `Done! Reimagined the "${phase.label}" phase with fresh ideas. Have a look at Days ${phase.dayFrom}-${phase.dayTo}.`,
    ];
    setChatMessages(prev => [...prev, { role: 'assistant', content: acks[Math.floor(Math.random() * acks.length)], planUpdated: true }]);
    setToast(`"${phase.label}" phase regenerated`);
    markDirty();
    setItineraryVersion(v => v + 1);
  };

  // ── End R4 handlers ───────────────────────────────────────────────────────

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
      // P2-1: close the modal on save failure so the error toast set by
      // saveTrip becomes visible. Previously the modal stayed open and the
      // toast (which now has zIndex 10000) sat in front of it but the modal
      // looped indefinitely with no path to recovery. Closing the modal
      // returns the user to the plan page where they can read the error and
      // regenerate the trip.
      setUnsavedModal({ isOpen: false, pendingDestination: '', pendingType: 'link', isSaving: false });
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
  const [initialItineraryPhases, setInitialItineraryPhases] = useState<Phase[] | undefined>(undefined);
  // R5 hotfix #3: page-level phase mirror — fallback when itineraryRef.getPhases() returns empty
  const [pagePhasesMirror, setPagePhasesMirror] = useState<Phase[]>([]);
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
    const phases = itineraryRef.current?.getPhases() ?? [];
    // P2-1: always include itineraryPhases (even as []) so the server-side
    // merge can clear phases consistently. Without the key, the merge would
    // preserve any stale phases on the existing row.
    const trip_data = {
      plan, photos, acceptedHotels, prompt,
      itineraryDays: snapshot,
      itineraryPhases: phases,
    };
    return { dest, sd, ed, title, trip_data };
  };

  /**
   * R2 guard. Detect inconsistent trip state where the AI produced structured
   * days but no markdown narrative. Saving this state corrupts the user's
   * library with trips that have empty Overview/Weather/Transport/Tips/Stays
   * tabs. Returns null if safe to save; otherwise returns a translation key
   * + context object so the caller can surface a user-visible error.
   *
   * Threshold of 100 chars (not 0) covers cases where a partial stream
   * persists a stray header. Genuine narratives are always > 5000 chars.
   */
  const validateTripPayloadForSave = (
    payload: ReturnType<typeof buildTripPayload>
  ): { tKey: string; planLen: number; daysCount: number } | null => {
    const planLen = (payload.trip_data.plan ?? '').length;
    const daysCount = payload.trip_data.itineraryDays?.length ?? 0;
    if (planLen < 100 && daysCount > 0) {
      return { tKey: 'errors.emptyPlanFullDays', planLen, daysCount };
    }
    return null;
  };

  const handleShareClick = async () => {
    if (!savedTripId) {
      const shouldSave = window.confirm(t('shareRequiresSave'));
      if (shouldSave) {
        const success = await saveTrip();
        if (success) setInviteOpen(true);
      }
      return;
    }
    setInviteOpen(true);
  };

  const leaveTrip = async () => {
    if (!savedTripId) return;
    if (!window.confirm(t('leaveConfirm'))) return;
    const res = await fetch(`/api/trips/${savedTripId}/leave`, { method: 'POST' });
    if (res.ok) {
      router.push('/my-trips');
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? 'Could not leave trip. Please try again.');
    }
  };

  const saveTrip = async (): Promise<boolean> => {
    if (!user) { openGate('Save trip'); return false; }

    const payload = buildTripPayload();
    const validationError = validateTripPayloadForSave(payload);
    if (validationError) {
      console.warn('[saveTrip] Refused to save inconsistent payload', validationError);
      // P2-1: error variant so the user sees a visible red error rather than
      // a green-checkmark toast that reads as success.
      setToast(t(validationError.tKey), 'error');
      return false;
    }

    setSaveLoading(true);
    try {
      const { dest, sd, ed, title, trip_data } = payload;
      // Stage 3a: build keyed shape for collab trips, flat for solo.
      const baseHistory = isKeyedHistory(fullChatHistory)
        ? fullChatHistory
        : (tripIsCollaborative && tripOwnerId && Array.isArray(fullChatHistory) && (fullChatHistory as unknown[]).length > 0
            ? migrateToKeyed(fullChatHistory as Parameters<typeof migrateToKeyed>[0], tripOwnerId)
            : fullChatHistory);
      const chatToSave = user
        ? writeUserChatHistory(baseHistory, user.id, chatMessages, tripIsCollaborative)
        : chatMessages;
      if (savedTripId) {
        const res = await fetch('/api/trips', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedTripId, title, trip_data, chat_history: chatToSave }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      } else {
        const res = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, destination: dest, start_date: sd, end_date: ed, trip_data, chat_history: chatToSave }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
        const json = await res.json();
        if (json.id) setSavedTripId(json.id);
      }
      setFullChatHistory(chatToSave);
      setIsDirty(false);
      setToast(savedTripId ? 'Trip updated! ✓' : 'Trip saved! ✓');
      return true;
    } catch (err) {
      console.error('[saveTrip] error:', err);
      setToast('Could not save trip. Please try again.', 'error');
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

      // For collaborative trips, fetch collaborator names and roles for the PDF
      let collaborators: Array<{ name: string; role: string }> | undefined;
      if (COLLAB_ENABLED && tripIsCollaborative && savedTripId) {
        const res = await fetch(`/api/trips/${savedTripId}/collaborators`).catch(() => null);
        if (res?.ok) {
          const body = await res.json().catch(() => ({}));
          const collabs: Array<{ full_name: string | null; email: string | null; role: string }> = body.collaborators ?? [];
          collaborators = collabs.map(c => ({
            name: c.full_name ?? c.email ?? 'Unknown',
            role: c.role,
          }));
        }
      }

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
        collaborators,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getActivitiesText = React.useCallback(() => {
    const days = itineraryRef.current?.getDaysSnapshot() ?? [];
    if (days.length === 0) return '';

    const slotOrder: Array<'morning' | 'afternoon' | 'evening' | 'night'> = [
      'morning', 'afternoon', 'evening', 'night',
    ];
    const slotLabels: Record<string, string> = {
      morning: 'MORNING (6am-12pm)',
      afternoon: 'AFTERNOON (12pm-6pm)',
      evening: 'EVENING (6pm-9pm)',
      night: 'NIGHT (9pm onwards)',
    };

    return days.map(d => {
      const dayHeader = `DAY ${d.number}: ${d.title || 'Untitled'}`;
      const slotBlocks = slotOrder.map(slot => {
        const slotActivities = d.activities.filter(a => a.slot === slot);
        const label = slotLabels[slot];
        if (slotActivities.length === 0) {
          return `  ${label}:\n    (empty)`;
        }
        const lines = slotActivities.map((a, idx) => {
          const statusTag = a.status === 'declined' ? ' [DECLINED]'
                          : a.status === 'pending' ? ' [PENDING]'
                          : '';
          const text = a.text.replace(/\*\*/g, '').replace(/^\s*[-*]\s*/, '').trim();
          return `    [${idx}] ${text}${statusTag}`;
        });
        return `  ${label}:\n${lines.join('\n')}`;
      });
      return `${dayHeader}\n${slotBlocks.join('\n')}`;
    }).join('\n\n');
  }, []);

  // Place photo popup (legacy, used when NEXT_PUBLIC_PLACE_PREVIEW_ENABLED is false)
  const [popup, setPopup] = useState<{ name:string; x:number; y:number } | null>(null);
  const [photoCache, setPhotoCache] = useState<Record<string, string | null | '__loading__'>>({});
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Rich place preview card (used when NEXT_PUBLIC_PLACE_PREVIEW_ENABLED is true)
  const [placePreview, setPlacePreview] = useState<{
    resolveResponse: ResolveResponse | null;
    loading: boolean;
    position: { x: number; y: number };
    name: string;
  } | null>(null);

  // Normal generation — skip if we have a tripId or a pending guest draft
  useEffect(() => {
    if (tripId) return;
    if (typeof window !== 'undefined' && localStorage.getItem('guest_trip_draft')) return;
    if (prompt) generatePlan(prompt);
  }, []); // eslint-disable-line

  // Handle tripId (load saved trip) and guest draft restoration — wait for auth to settle first
  useEffect(() => {
    if (authLoading) return;

    // Auto-generate after login redirect from login gate on /start
    if (typeof window !== 'undefined') {
      const shouldAutoGenerate = new URLSearchParams(window.location.search).get('autoGenerate') === 'true';
      if (shouldAutoGenerate && user && !plan) {
        const url = new URL(window.location.href);
        url.searchParams.delete('autoGenerate');
        window.history.replaceState({}, '', url.toString());
        try {
          const draftStr = localStorage.getItem('luna_trip_draft');
          if (draftStr) {
            const draft = JSON.parse(draftStr);
            if (draft.prompt) {
              localStorage.removeItem('luna_trip_draft');
              generatePlan(draft.prompt);
              return;
            }
          }
        } catch {}
      }
    }

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
      const { data, error: fetchErr } = await supabase.from('saved_trips').select('*').eq('id', id).single();
      if (fetchErr) {
        console.error('[loadSavedTripById] Supabase fetch error:', fetchErr);
        setError('Failed to load saved trip. Please try again.');
        return;
      }
      if (!data || !data.trip_data) {
        setError('Could not load saved trip.');
        return;
      }

      // Defensive normalization. The trip_data shape has evolved across migrations:
      //   - Legacy: { plan, photos, prompt, acceptedHotels, itineraryDays }
      //   - Current: { itineraryDays, itineraryPhases, acceptedHotels } (structured-only)
      //   - Partial rows may have any subset.
      // We coerce missing keys to safe defaults so the render gate (hasContent)
      // can resolve to true whenever any meaningful content exists.
      const tdRaw = data.trip_data as Record<string, unknown>;
      const td = {
        plan: typeof tdRaw.plan === 'string' ? tdRaw.plan : '',
        photos: Array.isArray(tdRaw.photos) ? (tdRaw.photos as string[]) : [],
        acceptedHotels: Array.isArray(tdRaw.acceptedHotels) ? (tdRaw.acceptedHotels as AcceptedHotel[]) : [],
        itineraryDays: Array.isArray(tdRaw.itineraryDays) ? (tdRaw.itineraryDays as Day[]) : [],
        itineraryPhases: Array.isArray(tdRaw.itineraryPhases) ? (tdRaw.itineraryPhases as Phase[]) : [],
      };

      setPlan(td.plan);
      setPhotos(td.photos);
      setAcceptedHotels(td.acceptedHotels);
      if (td.itineraryDays.length > 0) {
        setInitialItineraryDays(td.itineraryDays);
      }
      if (td.itineraryPhases.length > 0) {
        setInitialItineraryPhases(td.itineraryPhases);
        setPagePhasesMirror(td.itineraryPhases);
      }
      // Stage 3a: per-user chat threads.
      const isCollab = Boolean(data.is_collaborative);
      const ownerId = (data.user_id as string) ?? null;
      setTripIsCollaborative(isCollab);
      setTripOwnerId(ownerId);
      const rawChatHistory = data.chat_history as ChatHistory | null | undefined;
      setFullChatHistory(rawChatHistory ?? null);
      const currentUserId = user?.id ?? '';
      const userThread = rawChatHistory
        ? readUserChatHistory(rawChatHistory, currentUserId, { isCollaborative: isCollab, ownerId: ownerId ?? undefined })
        : [];
      if (userThread.length > 0) {
        setChatMessages(userThread);
      }
      setSavedTripId(data.id as string);
      if (data.destination) setSavedTripDestination(data.destination as string);
      // Stage 2e: populate start/end so the destination card has dates
      // and the day-count badge when the user opens via ?tripId= only.
      if (data.start_date) setSavedTripStartDate(data.start_date as string);
      if (data.end_date) setSavedTripEndDate(data.end_date as string);
    } catch (err) {
      console.error('[loadSavedTripById] unexpected error:', err);
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
    // Viewers don't save chat_history (read-only queries only)
    if (myRole === 'viewer') return;
    if (chatSyncTimer.current) clearTimeout(chatSyncTimer.current);
    chatSyncTimer.current = setTimeout(async () => {
      // Stage 3a: build keyed shape for collab trips; flat for solo.
      const existingFull = isKeyedHistory(fullChatHistory)
        ? fullChatHistory
        : (tripIsCollaborative && tripOwnerId && Array.isArray(fullChatHistory) && (fullChatHistory as unknown[]).length > 0
            ? migrateToKeyed(fullChatHistory as Parameters<typeof migrateToKeyed>[0], tripOwnerId)
            : fullChatHistory);
      const chatToSave = writeUserChatHistory(existingFull, user.id, chatMessages, tripIsCollaborative);
      setFullChatHistory(chatToSave);

      const isOwner = !tripIsCollaborative || user.id === tripOwnerId;
      if (isOwner) {
        // Owner path: /api/trips PATCH filter matches user_id (already works)
        await fetch('/api/trips', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedTripId, chat_history: chatToSave }),
        });
      } else {
        // Stage 3a hotfix: collaborator path — dedicated endpoint that
        // server-merges the keyed thread without the owner user_id filter.
        await fetch(`/api/trips/${savedTripId}/chat-history`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_history: chatToSave }),
        });
      }
    }, 2000);
    return () => { if (chatSyncTimer.current) clearTimeout(chatSyncTimer.current); };
  }, [chatMessages]); // eslint-disable-line

  const loadDestinationPhotos = async (prompt: string) => {
    const dest = prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)/i,'').trim().split(' ').slice(0,5).join(' ');
    setIsLoadingPhotos(true);
    try {
      if (process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED === 'true' && dest) {
        try {
          const slug = encodeURIComponent(
            dest.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          );
          const res = await fetch(`/api/destination-header/${slug}`);
          if (res.ok) {
            const data = await res.json() as { photos?: { url: string }[] };
            if (data.photos && data.photos.length > 0) {
              setPhotos(data.photos.map(p => p.url));
              return;
            }
          }
        } catch (err) {
          console.warn('[DestHeader] New pipeline failed, falling back:', err);
        }
      }
      const pr = await fetch(`/api/destination-photos?city=${encodeURIComponent(dest)}`);
      if (pr.ok) { const pd = await pr.json(); setPhotos(pd.photos||[]); }
    } catch {}
    finally { setIsLoadingPhotos(false); }
  };

  const generatePlan = async (p: string) => {
    setLoading(true); setError(''); setPlan('');
    setIsStreaming(true);

    // Switch EditableItinerary into structured-from-stream mode BEFORE any
    // events arrive. This clears days/phases and suppresses the legacy
    // markdown re-parse effect.
    itineraryRef.current?.beginStructuredStream();
    setStreamedDayCount(0);

    // Kick off destination photos in parallel with the AI stream.
    const dest = p
      .replace(/^plan a (trip to |)?/i, '')
      .replace(/\b(from \d{4}-\d{2}-\d{2}.*)/i, '')
      .trim()
      .split(' ')
      .slice(0, 5)
      .join(' ');
    void loadDestinationPhotos(dest);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, locale }),
      });
      if (!res.ok) throw new Error('Failed');
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let lastFlush = 0;
      const FLUSH_INTERVAL = 120; // ms

      const flushText = () => {
        setPlan(accumulated);
        // Flip loading off once we have meaningful narrative content.
        if (accumulated.length > 100) setLoading(false);
        lastFlush = Date.now();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr);

            // ── Text tokens (6 narrative sections) ──────────────────────
            const token = event?.choices?.[0]?.delta?.content;
            if (typeof token === 'string') {
              accumulated += token;
              const now = Date.now();
              if (now - lastFlush >= FLUSH_INTERVAL) flushText();
              continue;
            }

            // ── Tool_use events (structured itinerary) ───────────────────
            // Emitted by lib/ai-stream.ts when a content_block_stop closes
            // a tool_use block. Shape: { tool_use: { id, name, input } }
            const toolUse = event?.tool_use;
            if (toolUse && typeof toolUse === 'object' && toolUse.name) {
              if (toolUse.name === 'define_day') {
                try {
                  const input = (toolUse.input ?? {}) as Record<string, unknown>;
                  const normalized = normalizeDefineDayInput(input);
                  if (normalized) {
                    const rulesCtx: TripRulesContext = parsePromptContext(prompt);
                    const safeInput = applyStage4Rules(normalized as import('@/lib/ai').DefineDayInputForRules, rulesCtx);
                    const safeNormalized = {
                      ...normalized,
                      morning:   (safeInput.morning   ?? normalized.morning)   as string[],
                      afternoon: (safeInput.afternoon ?? normalized.afternoon) as string[],
                      evening:   (safeInput.evening   ?? normalized.evening)   as string[],
                      night:     (safeInput.night     ?? normalized.night)     as string[],
                    };
                    const day = defineDayInputToDay(safeNormalized);
                    itineraryRef.current?.setStructuredDay(day);
                    setStreamedDayCount(c => c + 1);
                  }
                } catch (err) {
                  console.error('[plan] failed to apply define_day:', err, toolUse.input);
                }
                continue;
              }
              if (toolUse.name === 'define_phase') {
                try {
                  const input = (toolUse.input ?? {}) as Record<string, unknown>;
                  const normalized = normalizeDefinePhaseInput(input);
                  if (normalized) {
                    const phase = definePhaseInputToPhase(normalized);
                    itineraryRef.current?.upsertPhase(phase);
                    setPagePhasesMirror(prev => {
                      const idx = prev.findIndex(p => p.id === phase.id);
                      if (idx >= 0) { const next = [...prev]; next[idx] = phase; return next; }
                      return [...prev, phase];
                    });
                  }
                } catch (err) {
                  console.error('[plan] failed to apply define_phase:', err, toolUse.input);
                }
                continue;
              }
              console.warn('[plan] unexpected tool_use name:', toolUse.name);
            }
          } catch {
            /* skip malformed SSE lines */
          }
        }
      }

      // Final flush — captures any trailing text since the last throttled flush.
      flushText();

      setIsDirty(true);
      trackTripPlanGenerated(dest);
    } catch (err) {
      console.error('[plan] generatePlan failed:', err);
      setError('Failed to generate your travel plan. Please try again.');
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  // cityContext for the place resolver — same derivation as EditableItinerary's destination prop
  const tripCityContext = (prompt
    ? prompt.replace(/^plan a (trip to |)?/i, '').replace(/\b(from \d{4}-\d{2}-\d{2}.*)/i, '').trim().split(/\s+/).slice(0, 5).join(' ')
    : '') || savedTripDestination;

  const handlePlaceMouseOver = async (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-place]') as HTMLElement | null;
    if (!el) return;
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    const name = el.getAttribute('data-place')!;
    const rect = el.getBoundingClientRect();

    if (placePreviewEnabled) {
      const x = Math.min(rect.left, window.innerWidth - 320 - 16);
      const y = rect.bottom + 8;
      setPlacePreview({ name, loading: true, resolveResponse: null, position: { x, y } });
      try {
        const result = await resolvePlace({ query: name, cityContext: tripCityContext });
        setPlacePreview(prev => prev?.name === name ? { ...prev, loading: false, resolveResponse: result } : prev);
      } catch {
        setPlacePreview(prev => prev?.name === name ? { ...prev, loading: false } : prev);
      }
    } else {
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
    }
  };

  const handlePlaneMouseLeave = () => {
    if (placePreviewEnabled) {
      hideTimer.current = setTimeout(() => setPlacePreview(null), 200);
    } else {
      hideTimer.current = setTimeout(() => setPopup(null), 120);
    }
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
        body: JSON.stringify({ prompt, existingActivities, seenIdeas: seenIdeaNames, itineraryContext, locale }),
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

  const sectionContent = plan ? extractSection(plan, activeSection, isStreaming) : '';

  // Render gate source of truth. A trip is renderable when it has any of:
  // narrative markdown (legacy shape), structured days, or structured phases.
  // This prevents render-gate drift if the AI pipeline shape changes again.
  // See app/[locale]/plan/page.tsx render branches around line 1270 and 1962.
  const hasContent = Boolean(
    plan ||
    (initialItineraryDays && initialItineraryDays.length > 0) ||
    (initialItineraryPhases && initialItineraryPhases.length > 0)
  );

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
              <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:22, color:'#00447B', marginBottom:8 }}>{t('crafting')}</p>
              <p style={{ fontFamily:"'Inter',sans-serif", color:'#6C6D6F', fontSize:15 }}>{t('usuallyTakes')}</p>
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
        {!loading && !error && hasContent && (
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
                // Stage 2e: prefer prompt-parsed values, fall back to saved-trip
                // state. This covers the joined-collaborator case where the URL
                // is /plan?tripId=... with no `prompt` param.
                const ciM = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
                const coM = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
                const sd = ciM?.[1] || savedTripStartDate || undefined;
                const ed = coM?.[1] || savedTripEndDate || undefined;
                const dl = toDateLocale(locale);
                const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(dl,{day:'2-digit',month:'long',year:'numeric'});
                const numDays = sd && ed ? Math.round((new Date(ed).getTime() - new Date(sd).getTime()) / 86400000) : null;
                const destinationFromPrompt = prompt
                  ? prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)/i,'').trim().split(' ').slice(0,5).join(' ')
                  : '';
                const destination = destinationFromPrompt || savedTripDestination || '';
                return (
                  <div style={{ marginBottom:20, display:'flex', borderRadius:16, border:'1px solid #E5E7EB', background:'#fff', overflow:'hidden' }}>
                    {/* Orange accent bar */}
                    <div style={{ width:5, flexShrink:0, background:'#FF8210', borderRadius:'16px 0 0 16px' }} />
                    {/* Content */}
                    <div style={{ flex:1, padding:'20px 24px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                      {/* Left — title, dates, secondary actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {/* Destination + duration badge */}
                        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                          <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:28, color:'#00447B', margin:0, lineHeight:1.2 }}>
                            {destination}
                          </p>
                          {numDays !== null && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#FFF4EA', color:'#CC6200', border:'1px solid #FFD0A0', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:600, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {t('daysTrip', { n: numDays })}
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
                        {/* Secondary actions — Export PDF + New trip + Share */}
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4, flexWrap:'wrap' }}>
                          <button
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            style={{ background:'none', border:'1.5px solid rgba(0,68,123,0.20)', color:'#00447B', fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:13, padding:'7px 16px', borderRadius:100, cursor: isExportingPDF ? 'default' : 'pointer', opacity: isExportingPDF ? 0.7 : 1 }}
                          >
                            {isExportingPDF ? t('header.generatingPdf') : t('header.exportPdf')}
                          </button>
                          <button onClick={()=>router.push('/')} style={{ background:'#00447B', color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, padding:'8px 20px', borderRadius:100, cursor:'pointer', border:'none' }}>
                            {t('newTrip')}
                          </button>
                          {COLLAB_ENABLED && myRole !== 'editor' && myRole !== 'viewer' && (
                            <button
                              onClick={handleShareClick}
                              aria-label={tCollab('button')}
                              title={tCollab('button')}
                              style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px 8px',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#00447B',
                                flexShrink: 0,
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = '0.6'; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                            >
                              <Share size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Right — Presence avatars + Invite (owner only, flag-gated) + Save */}
                      {collab.enabled && (
                        <div style={{ display: 'flex', alignItems: 'center', marginRight: 12, paddingLeft: 6 }}>
                          <CollaboratorAvatars
                            presence={collab.presence}
                            currentUserId={user?.id}
                            maxVisible={3}
                          />
                        </div>
                      )}
                      {COLLAB_ENABLED && tripIsCollaborative && savedTripId && myRole && myRole !== 'owner' && (
                        <button
                          onClick={leaveTrip}
                          style={{
                            background: 'none',
                            color: '#6C6D6F',
                            border: '1.5px solid rgba(108,109,111,0.35)',
                            fontFamily: "'Poppins',sans-serif",
                            fontWeight: 600,
                            fontSize: 13,
                            padding: '8px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'color 0.15s, border-color 0.15s',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            marginRight: 8,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#DC2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#6C6D6F'; e.currentTarget.style.borderColor = 'rgba(108,109,111,0.35)'; }}
                        >
                          {t('header.leaveTrip')}
                        </button>
                      )}
                      {!isViewerRole && (
                        <button
                          onClick={saveTrip}
                          disabled={saveLoading || (!!savedTripId && !isDirty)}
                          style={{
                            background: saveLoading ? 'rgba(255,130,16,0.6)' : (savedTripId && !isDirty) ? '#16A34A' : '#FF8210',
                            color: '#fff', border: 'none',
                            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
                            padding: '10px 22px', borderRadius: 8,
                            cursor: (saveLoading || (!!savedTripId && !isDirty)) ? 'default' : 'pointer',
                            transition: 'background 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
                          }}
                        >
                          {saveLoading ? t('header.saving') : (savedTripId && !isDirty) ? '✓ Saved' : savedTripId ? 'Save changes' : t('header.saveTrip')}
                        </button>
                      )}
                      {COLLAB_ENABLED && inviteOpen && savedTripId && (
                        <InviteModal
                          tripId={savedTripId}
                          locale={locale}
                          onClose={() => setInviteOpen(false)}
                        />
                      )}
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
                      <s.Icon /> {sectionLabel(s.id)}
                    </button>
                  );
                })}
              </div>

              {/* Phase 1 streaming placeholder — shows while narrative sections stream but no day cards have arrived yet */}
              {activeSection === 'itinerary' && isStreaming && streamedDayCount === 0 && (
                <div style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '40px 32px',
                  textAlign: 'center',
                  border: '1px solid rgba(0,68,123,0.08)',
                  boxShadow: '0 2px 12px rgba(0,68,123,0.06)',
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '3px solid rgba(0,68,123,0.12)',
                    borderTop: '3px solid #FF8210',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px',
                  }} />
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#00447B',
                    marginBottom: 8,
                  }}>
                    Luna is drafting your trip
                  </p>
                  <p style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    color: '#6C6D6F',
                    lineHeight: 1.6,
                  }}>
                    Writing the overview, weather tips, stays, transport, budget, and practical advice first.
                    <br />
                    Your day-by-day itinerary will appear here in a moment.
                  </p>
                </div>
              )}

              {/* Rendered plan section */}
              {/* EditableItinerary always stays mounted to preserve user changes */}
              <div style={{ display: activeSection === 'itinerary' ? 'block' : 'none' }}>
                <EditableItinerary
                  ref={itineraryRef}
                  itineraryMd={extractSection(plan, 'itinerary')}
                  destination={
                    (prompt
                      ? prompt.replace(/^plan a (trip to |)?/i,'').split(/\s+/).slice(0,4).join(' ')
                      : '') || savedTripDestination
                  }
                  tripPrompt={prompt}
                  photos={photos}
                  acceptedHotels={acceptedHotels}
                  onActivityStatusChange={() => { setItineraryVersion(v => v + 1); markDirty(); }}
                  onPlaceHover={handlePlaceMouseOver}
                  onPlaceLeave={handlePlaneMouseLeave}
                  isGuest={!user}
                  onGateRequired={() => openGate(t('extraIdeas.show'))}
                  initialDays={initialItineraryDays}
                  initialPhases={initialItineraryPhases}
                  startDate={prompt.match(/from (\d{4}-\d{2}-\d{2})/)?.[1] || savedTripStartDate || undefined}
                  locale={locale}
                  isStreaming={isStreaming}
                  onRegenerateDay={handleRegenerateDayClick}
                  onRegeneratePhase={handleRegeneratePhaseClick}
                  regenEnabled={process.env.NEXT_PUBLIC_REGENERATION_ENABLED !== 'false'}
                  onPatchEmit={collab.enabled ? collab.emitPatch : undefined}
                  readOnly={isViewerRole}
                  commentConfig={COLLAB_ENABLED && tripIsCollaborative && savedTripId ? {
                    tripId: savedTripId,
                    comments,
                    currentUserId: user?.id ?? '',
                    isOwner: !tripIsCollaborative || myRole === 'owner',
                    onRefresh: fetchComments,
                    emitPatch: collab.enabled ? collab.emitPatch : undefined,
                  } as CommentConfig : undefined}
                  tripLengthMode={(() => {
                    // Stage 2e: fall back to savedTripStartDate / savedTripEndDate
                    // so joined collaborators (no `prompt`) still get the right
                    // tripLengthMode from saved trip dates.
                    const sd = prompt.match(/from (\d{4}-\d{2}-\d{2})/)?.[1] || savedTripStartDate || '';
                    const ed = prompt.match(/to (\d{4}-\d{2}-\d{2})/)?.[1] || savedTripEndDate || '';
                    const d = sd && ed ? Math.ceil((new Date(ed).getTime() - new Date(sd).getTime()) / 86400000) + 1 : 0;
                    return (d >= 15 ? 'long' : d >= 7 ? 'medium' : 'short') as TripLengthMode;
                  })()}
                  onPlanPhase={async (phase: Phase): Promise<void> => {
                    if (!user) { openGate('Plan phase days'); throw new Error('Login required'); }

                    const ciM = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
                    const coM = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
                    const dest = prompt
                      .replace(/^plan a (trip to |)?/i, '')
                      .replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i, '')
                      .trim().split(' ').slice(0, 5).join(' ');

                    const allDays = itineraryRef.current?.getDaysSnapshot() ?? [];
                    const earlierDays = allDays.filter(d => d.number < phase.dayFrom && d.activities.length > 0);
                    const alreadyPlannedSummary = earlierDays.length > 0
                      ? earlierDays.map(d =>
                          `Day ${d.number} (${d.title}): ${d.activities
                            .filter(a => a.status !== 'declined')
                            .map(a => a.text.replace(/\*\*/g, '').slice(0, 80))
                            .join('; ')}`
                        ).join('\n')
                      : undefined;

                    const res = await fetch('/api/expand-phase', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        phase: {
                          id: phase.id,
                          label: phase.label,
                          day_from: phase.dayFrom,
                          day_to: phase.dayTo,
                          summary: phase.summary,
                          highlights: phase.highlights,
                        },
                        destination: dest,
                        startDate: ciM?.[1],
                        endDate: coM?.[1],
                        alreadyPlannedSummary,
                        locale,
                      }),
                    });

                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error((err as { error?: string }).error || 'Could not plan these days. Please try again.');
                    }

                    const reader = res.body!.getReader();
                    const decoder = new TextDecoder();
                    let buf = '';
                    let dayCount = 0;

                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      buf += decoder.decode(value, { stream: true });

                      const lines = buf.split('\n');
                      buf = lines.pop() ?? '';

                      for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const jsonStr = line.slice(6).trim();
                        if (!jsonStr || jsonStr === '[DONE]') continue;
                        try {
                          const event = JSON.parse(jsonStr);
                          const toolUse = event?.tool_use;
                          if (toolUse?.name === 'define_day') {
                            const normalized = normalizeDefineDayInput((toolUse.input ?? {}) as Record<string, unknown>);
                            if (normalized) {
                              itineraryRef.current?.setStructuredDay(defineDayInputToDay(normalized));
                              dayCount++;
                            }
                          }
                        } catch { /* skip malformed */ }
                      }
                    }

                    if (dayCount === 0) throw new Error('No days were planned. Please try again.');

                    const dayRange = phase.dayFrom === phase.dayTo
                      ? `Day ${phase.dayFrom}`
                      : `Days ${phase.dayFrom} to ${phase.dayTo}`;
                    const ackMessages = [
                      `Done! I just planned ${dayRange} for the "${phase.label}" phase. Have a look below, let me know if you want to swap an activity, slow it down, or add more nightlife.`,
                      `${dayRange} are ready! I built out the "${phase.label}" phase based on the summary and highlights. Take a look, happy to tweak anything.`,
                      `Just planned ${dayRange} for "${phase.label}". Scroll down to see them. If anything doesn't feel right, just tell me what to change.`,
                    ];
                    setInjectedChatMessage({ content: ackMessages[Math.floor(Math.random() * ackMessages.length)], nonce: Date.now() });
                    setItineraryVersion(v => v + 1);
                    markDirty();
                  }}
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
                      commentConfig={COLLAB_ENABLED && tripIsCollaborative && savedTripId ? {
                        tripId: savedTripId,
                        comments,
                        currentUserId: user?.id ?? '',
                        isOwner: !tripIsCollaborative || myRole === 'owner',
                        onRefresh: fetchComments,
                        emitPatch: collab.enabled ? collab.emitPatch : undefined,
                      } as CommentConfig : undefined}
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
                  {sectionContent.startsWith('__STREAMING_PLACEHOLDER__') ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '3px solid rgba(0,68,123,0.12)',
                        borderTop: '3px solid #FF8210',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 18px',
                      }} />
                      <p style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: '#00447B',
                        margin: '0 0 6px',
                      }}>
                        {sectionContent.replace('__STREAMING_PLACEHOLDER__', '')} is being written
                      </p>
                      <p style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 13,
                        color: '#6C6D6F',
                        lineHeight: 1.6,
                      }}>
                        Luna is working through the sections one at a time. This one will appear in a moment.
                      </p>
                    </div>
                  ) : (
                    <div
                      onMouseOver={handlePlaceMouseOver}
                      onMouseLeave={handlePlaneMouseLeave}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(sectionContent), PLAN_SANITIZE_CONFIG) }}
                    />
                  )}
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
                        ← {sectionLabel(prev.id)}
                      </button>
                    ) : <div />}
                    {next && (
                      <button onClick={()=>setActiveSection(next.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'#00447B', border:'none', color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, padding:'8px 18px', borderRadius:100, cursor:'pointer' }}>
                        {sectionLabel(next.id)} →
                      </button>
                    )}
                  </>;
                })()}
              </div>

              {/* ── Extra Ideas ── */}
              {activeSection === 'itinerary' && (
              <div style={{ marginTop:20 }}>
                <button
                  onClick={() => user ? handleExtraIdeas() : openGate(t('extraIdeas.show'))}
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
                  {showExtraIdeas ? t('extraIdeas.hide') : t('extraIdeas.show')}
                  <span style={{ fontSize:12, transition:'transform 0.2s', transform: showExtraIdeas ? 'rotate(180deg)' : 'rotate(0deg)', display:'inline-block' }}>▾</span>
                </button>

                {showExtraIdeas && (
                  <div style={{ marginTop:12, background:'#fff', borderRadius:14, border:'1.5px solid rgba(0,68,123,0.08)', boxShadow:'0 2px 16px rgba(0,68,123,0.06)', animation:'fadeIn 0.2s ease both' }}>
                    <div style={{ padding:'18px 24px 6px', borderBottom:'1px solid rgba(0,68,123,0.07)', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>💡</span>
                      <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:'#00447B' }}>{t('moreIdeas')}</p>
                    </div>
                    <div style={{ padding:'16px 24px 20px' }}>
                      {extraIdeasLoading ? (
                        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0' }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', border:'2.5px solid rgba(0,68,123,0.10)', borderTop:'2.5px solid #FF8210', animation:'spin 0.9s linear infinite', flexShrink:0 }} />
                          <p style={{ fontFamily:"'Inter',sans-serif", color:'#9CA3AF', fontSize:13 }}>{t('loadingIdeas')}</p>
                        </div>
                      ) : (() => {
                        const ideas = parseIdeas(extraIdeas);
                        const days = itineraryRef.current?.getDays() ?? [];
                        if (ideas.length === 0) return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(extraIdeas), PLAN_SANITIZE_CONFIG) }} />;
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

          {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}

          {COLLAB_ENABLED && tripIsCollaborative && <CollabToast patch={collabIncomingPatch} />}

          <FloatingChat
            plan={plan}
            destination={prompt.replace(/^plan a (trip to |)?/i,'').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i,'').trim().split(' ').slice(0,5).join(' ')}
            hotelContext={acceptedHotels.length > 0
              ? acceptedHotels.map(({ hotel, segment }) =>
                  `The user has confirmed their stay at ${hotel.name} (${hotel.stars}★, ${hotel.neighborhood}) for ${segment.label}. Price: ${hotel.priceRange}. Amenities: ${hotel.amenities.join(', ')}.`
                ).join('\n')
              : undefined
            }
            getCurrentActivities={getActivitiesText}
            getPhases={() => {
              const refPhases = itineraryRef.current?.getPhases() ?? [];
              if (refPhases.length > 0) return refPhases;
              if (pagePhasesMirror.length > 0) {
                console.warn('[plan] getPhases ref returned empty, falling back to mirror', { mirror: pagePhasesMirror.length });
                return pagePhasesMirror;
              }
              return [];
            }}
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
                // Stage 2f hotfix #7c: position-based matching. Three prior
                // text-based attempts (#7, #7b, #7b-revised) all failed because
                // Luna paraphrases or hallucinates activity names instead of
                // copying exact text. Index within the time slot is
                // deterministic and matches user intent ("the first morning
                // activity"). Text matching is preserved as a fallback only
                // for legacy callers that may still emit activityText.
                const dayNum = update.day ?? 1;
                const days = itineraryRef.current?.getDaysSnapshot() ?? [];
                const targetDay = days.find(d => d.number === dayNum);
                if (!targetDay) {
                  console.warn('[remove_activity] day not found', { dayNum, available: days.map(d => d.number) });
                  return false;
                }

                // Slot resolution. Prefer explicit JSON timeSlot, then fall
                // back through alternative field names a parser might emit,
                // and finally keyword detection in any provided text.
                const validSlots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
                const candidateText = (update.activity || update.activityText || update.activity_text || update.location || '').trim();
                const norm = (s: string) => s.replace(/\*+/g, '').toLowerCase().trim();
                const luna = norm(candidateText);

                const slotRaw = (
                  update.timeSlot
                  ?? (update as { slot?: string }).slot
                  ?? (update as { resolvedSlot?: string }).resolvedSlot
                  ?? (update as { detectedSlot?: string }).detectedSlot
                  ?? ''
                ).toString().toLowerCase().trim();
                let resolvedSlot: TimeSlot | null = null;
                if ((validSlots as string[]).includes(slotRaw)) {
                  resolvedSlot = slotRaw as TimeSlot;
                } else if (luna) {
                  if (/\bmorning\b/.test(luna)) resolvedSlot = 'morning';
                  else if (/\bafternoon\b/.test(luna)) resolvedSlot = 'afternoon';
                  else if (/\bevening\b/.test(luna)) resolvedSlot = 'evening';
                  else if (/\bnight\b/.test(luna)) resolvedSlot = 'night';
                }

                if (!resolvedSlot) {
                  console.warn('[remove_activity] no timeSlot resolved', { dayNum, update });
                  setToast(`Couldn't determine which slot to remove from on Day ${dayNum}`);
                  return false;
                }

                const slotActivities = targetDay.activities.filter(a => a.slot === resolvedSlot);
                if (slotActivities.length === 0) {
                  console.warn('[remove_activity] no activities in slot', { dayNum, slot: resolvedSlot });
                  setToast(`No ${resolvedSlot} activities on Day ${dayNum}`);
                  return false;
                }

                // Primary strategy: position within the slot (0-based).
                let targetActivity: Activity | undefined;
                if (typeof update.activityIndex === 'number' && update.activityIndex >= 0 && update.activityIndex < slotActivities.length) {
                  targetActivity = slotActivities[update.activityIndex];
                }

                // Fallback: word-overlap text matching for legacy callers
                // that still emit activityText without an index. Threshold
                // 0.4 is intentionally lower than #7b's 0.5 because this is
                // a last resort.
                if (!targetActivity && luna) {
                  const needleWords = luna.split(/\s+/).filter(w => w.length > 2);
                  if (needleWords.length > 0) {
                    let bestScore = 0;
                    let bestCandidate: Activity | undefined;
                    for (const a of slotActivities) {
                      const aLower = norm(a.text);
                      const hits = needleWords.filter(w => aLower.includes(w)).length;
                      const score = hits / needleWords.length;
                      if (score > bestScore) {
                        bestScore = score;
                        bestCandidate = a;
                      }
                    }
                    if (bestScore >= 0.4) targetActivity = bestCandidate;
                  }
                }

                // Final fallback: single activity in the slot.
                if (!targetActivity && slotActivities.length === 1) {
                  targetActivity = slotActivities[0];
                }

                if (!targetActivity) {
                  console.warn('[remove_activity] no activity matched', {
                    dayNum,
                    slot: resolvedSlot,
                    activityIndex: update.activityIndex,
                    activityText: candidateText || undefined,
                    slotActivityCount: slotActivities.length,
                    candidates: slotActivities.map(a => a.text.slice(0, 60)),
                  });
                  setToast(`Couldn't find that activity on Day ${dayNum}`);
                  return false;
                }
                itineraryRef.current?.removeActivityById(targetActivity.id);
                setToast(`Activity removed from Day ${dayNum}`);
                markDirty();
                return true;
              }
              if (update.type === 'replace_activity') {
                const dayNum = update.day ?? 1;
                const slot = (update.timeSlot?.toLowerCase() ?? 'afternoon') as TimeSlot;
                const newText = update.location
                  ? `${update.newActivity} (${update.location})`
                  : (update.newActivity ?? '');

                // Route through replaceActivityById so the removal is wired to
                // onPatchEmitRef and broadcasts to collaborators. The old path
                // used removeActivitiesMatching which was a direct setDays call
                // with no broadcast (root cause: Browser B only saw the add).
                const days = itineraryRef.current?.getDaysSnapshot() ?? [];
                const targetDay = days.find(d => d.number === dayNum);
                const oldLower = (update.activity ?? '').toLowerCase().trim();
                const oldActivity = oldLower
                  ? targetDay?.activities.find(a => a.text.toLowerCase().includes(oldLower))
                  : undefined;

                if (oldActivity && newText) {
                  itineraryRef.current?.replaceActivityById(oldActivity.id, {
                    text: newText,
                    slot,
                    lunaAdded: true,
                    manuallyAdded: false,
                  });
                } else {
                  // Fallback: old activity not matched by text (e.g. not in this
                  // day, or update.activity absent). Remove by text pattern (no
                  // collab broadcast for removal) then add.
                  if (update.activity) itineraryRef.current?.removeActivitiesMatching(update.activity);
                  if (newText) itineraryRef.current?.addActivity(newText, dayNum, slot, false, true);
                }

                setToast(`Swapped activity on Day ${dayNum}`);
                markDirty();
                return;
              }
              if (update.type === 'edit_phase') {
                if (!update.phaseId) { console.warn('[edit_phase] missing phaseId', update); return; }
                if (!itineraryRef.current) { console.error('[edit_phase] itineraryRef.current is null'); setToast('Could not apply — please try again'); return; }
                itineraryRef.current.editPhase(update.phaseId, {
                  label:      update.phaseLabel,
                  summary:    update.phaseSummary,
                  highlights: update.phaseHighlights,
                });
                setToast('Phase updated');
                markDirty();
                return;
              }
              if (update.type === 'split_phase') {
                if (!update.phaseId || !update.splitAtDay || !update.phaseA || !update.phaseB) { console.warn('[split_phase] missing fields', update); return; }
                if (!itineraryRef.current) { console.error('[split_phase] itineraryRef.current is null'); setToast('Could not apply — please try again'); return; }
                itineraryRef.current.splitPhase(
                  update.phaseId,
                  update.splitAtDay,
                  update.phaseA,
                  update.phaseB,
                );
                setToast('Phase split');
                markDirty();
                return;
              }
              if (update.type === 'merge_phases') {
                if (!update.phaseIdA || !update.phaseIdB || !update.mergedPhase) { console.warn('[merge_phases] missing fields', update); return; }
                if (!itineraryRef.current) { console.error('[merge_phases] itineraryRef.current is null'); setToast('Could not apply — please try again'); return; }
                itineraryRef.current.mergePhases(
                  update.phaseIdA,
                  update.phaseIdB,
                  update.mergedPhase,
                );
                setToast('Phases merged');
                markDirty();
                return;
              }
              if (update.type === 'reorder_phases') {
                if (!update.orderedPhaseIds || update.orderedPhaseIds.length === 0) { console.warn('[reorder_phases] empty orderedPhaseIds', update); return; }
                if (!itineraryRef.current) { console.error('[reorder_phases] itineraryRef.current is null'); setToast('Could not apply — please try again'); return; }
                itineraryRef.current.reorderPhases(update.orderedPhaseIds);
                setToast('Phases reordered');
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
            pendingPrompt={pendingChatPrompt}
            onPendingPromptConsumed={() => setPendingChatPrompt(null)}
            injectedAssistantMessage={injectedChatMessage}
            onInjectedMessageConsumed={() => setInjectedChatMessage(null)}
          />
          {gateOpen && <GateOverlay onClose={() => setGateOpen(false)} tripSnapshot={plan ? { plan, photos, acceptedHotels, itineraryDays: itineraryRef.current?.getDaysSnapshot() ?? [], prompt } : undefined} />}
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && !hasContent && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 68px)' }}>
            {(tripId || (typeof window !== 'undefined' && !!localStorage.getItem('guest_trip_draft'))) ? (
              <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.12)', borderTop:'3px solid #FF8210', animation:'spin 1s linear infinite' }} />
            ) : (
              <div style={{ textAlign:'center' }}>
                <p style={{ fontFamily:"'Inter',sans-serif", color:'#6C6D6F', fontSize:16, marginBottom:16 }}>{t('noPrompt')}</p>
                <button onClick={()=>router.push('/')} style={{ background:'#FF8210', color:'#fff', border:'none', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:14, padding:'12px 28px', borderRadius:100, cursor:'pointer' }}>
                  {t('startPlanning')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Rich place preview card (NEXT_PUBLIC_PLACE_PREVIEW_ENABLED=true) ── */}
      {placePreviewEnabled && placePreview && (
        <div
          onMouseEnter={() => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } }}
          onMouseLeave={() => { hideTimer.current = setTimeout(() => setPlacePreview(null), 200); }}
          style={{
            position: 'fixed', zIndex: 9999,
            top: placePreview.position.y, left: placePreview.position.x,
            animation: 'popupFadeIn 0.15s ease both',
            pointerEvents: 'auto',
          }}
        >
          {placePreview.loading || !placePreview.resolveResponse ? (
            <PlacePreviewSkeleton />
          ) : placePreview.resolveResponse.source === 'not_found' || !placePreview.resolveResponse.place ? (
            <div style={{
              width: 320, borderRadius: 12, background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #E8E8E8',
              padding: '20px 16px', fontFamily: "'Inter', sans-serif",
            }}>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, color: '#00447B', marginBottom: 8 }}>
                {placePreview.name}
              </div>
              <div style={{ fontSize: 13, color: '#6C6D6F' }}>Details not available for this place.</div>
            </div>
          ) : (
            <PlacePreviewCard
              place={placePreview.resolveResponse.place}
              primaryPhotoUrl={placePreview.resolveResponse.primaryPhotoUrl}
            />
          )}
        </div>
      )}

      {/* ── Legacy place photo popup (NEXT_PUBLIC_PLACE_PREVIEW_ENABLED=false) ── */}
      {!placePreviewEnabled && popup && (
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
          {photoCache[popup.name] === '__loading__' || !(popup.name in photoCache) ? (
            <div style={{ height:160, background:'#F4F7FB', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.10)', borderTop:'3px solid #FF8210', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : photoCache[popup.name] ? (
            <img src={photoCache[popup.name]!} alt={popup.name} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
          ) : (
            <div style={{ height:100, background:'#F4F7FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📍</div>
          )}
          <div style={{ padding:'12px 14px 14px' }}>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:'#00447B', marginBottom:2 }}>{popup.name}</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9CA3AF' }}>{t('activity.tapToSearch')}</p>
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

      <RegenerationModal
        isOpen={regenModal.isOpen}
        mode={regenModal.mode}
        dayNumber={regenModal.dayNumber}
        phaseName={regenModal.phaseName}
        dayRange={regenModal.dayRange}
        hasAcceptedActivities={regenModal.hasAcceptedActivities}
        isSubmitting={regenModal.isSubmitting}
        onConfirm={handleRegenConfirm}
        onCancel={() => setRegenModal(prev => ({ ...prev, isOpen: false }))}
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
  const t = useTranslations('plan');
  const placePreviewEnabled = process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED === 'true';
  const fallback = (
    <div style={{ background:'#F4F7FB', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.12)', borderTop:'3px solid #FF8210', animation:'spin 1s linear infinite' }} />
      <p style={{ fontFamily:"'Poppins',sans-serif", color:'#00447B', fontSize:15 }}>{t('loading')}</p>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
  return (
    <Suspense fallback={fallback}>
      {placePreviewEnabled ? (
        <PlaceCacheProvider>
          <PlanContent />
        </PlaceCacheProvider>
      ) : (
        <PlanContent />
      )}
    </Suspense>
  );
}
