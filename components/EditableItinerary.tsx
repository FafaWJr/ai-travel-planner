'use client';
import { useState, useId, forwardRef, useImperativeHandle } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ─── Types ──────────────────────────────────────────────────── */
type Status   = 'pending' | 'accepted' | 'declined';
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

interface Activity {
  id: string;
  text: string;
  status: Status;
  slot: TimeSlot;
}
interface Suggestion {
  id: string;
  title: string;
  description: string;
  timing: string;
}
interface Day {
  number: number;
  title: string;
  activities: Activity[];
  open: boolean;
  suggestions: Suggestion[];
  loadingMore: boolean;
}

const SLOTS: { key: TimeSlot; label: string; icon: string }[] = [
  { key: 'morning',   label: 'Morning',   icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️'  },
  { key: 'evening',   label: 'Evening',   icon: '🌆' },
  { key: 'night',     label: 'Night',     icon: '🌙' },
];

const GRADIENTS = [
  'linear-gradient(135deg,#00447B,#0369A1)',
  'linear-gradient(135deg,#0F4C75,#1B7AB5)',
  'linear-gradient(135deg,#164E63,#0891B2)',
  'linear-gradient(135deg,#1E3A5F,#2563EB)',
  'linear-gradient(135deg,#312E81,#4F46E5)',
  'linear-gradient(135deg,#3B0764,#7C3AED)',
  'linear-gradient(135deg,#4A1942,#BE185D)',
];

/* ─── Inline markdown ────────────────────────────────────────── */
function inlineMd(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, (_, t) => {
      const isPlace = /^[A-Z]/.test(t) && !t.endsWith(':') &&
        !/^(morning|afternoon|evening|night|day\s*\d|note|tip|option|important|total|budget|price|cost|recommended|optional|estimated|approximate|include)/i.test(t);
      if (isPlace) {
        const esc = t.replace(/"/g, '&quot;');
        return `<strong data-place="${esc}" style="cursor:pointer;border-bottom:1.5px dashed rgba(0,68,123,0.40);color:#00447B;font-weight:700;transition:color 0.15s">${t}</strong>`;
      }
      return `<strong>${t}</strong>`;
    })
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/* ─── Parse slot from text/header ───────────────────────────── */
function detectSlot(text: string): TimeSlot | null {
  // Strip markdown bold/italic/heading markers before matching
  const t = text.replace(/^[\*#\s]+/, '').toLowerCase().trim();
  if (/^morning/i.test(t))   return 'morning';
  if (/^afternoon/i.test(t)) return 'afternoon';
  if (/^evening/i.test(t))   return 'evening';
  if (/^night/i.test(t))     return 'night';
  return null;
}

function stripSlotPrefix(text: string): string {
  return text
    // **Morning**: / **Morning:** / **Morning** — / *Morning* :
    .replace(/^\*{0,2}(Morning|Afternoon|Evening|Night)\*{0,2}\s*[:\-–—]\s*/i, '')
    // plain Morning: / Afternoon — / etc.
    .replace(/^(Morning|Afternoon|Evening|Night)\s*[:\-–—]\s*/i, '')
    .trim();
}

/* ─── Parse itinerary markdown into Day[] ───────────────────── */
function parseItinerary(md: string): Day[] {
  const content = md.replace(/^##[^\n]*\n+/m, '').trim();
  const segments = content.split(/\n(?=(?:###\s*)?(?:\*\*)?Day\s+\d+)/i);
  const days: Day[] = [];

  for (const seg of segments) {
    if (!seg.trim()) continue;
    const headerMatch = seg.match(/^(?:###\s*)?(?:\*\*)?Day\s+(\d+)[:\s–\-–]*([^\n*]*)\*?\*?/i);
    if (!headerMatch) continue;

    const number = parseInt(headerMatch[1], 10);
    const title  = headerMatch[2]?.replace(/\*\*$/, '').trim() || `Day ${number}`;

    const activities: Activity[] = [];
    let currentSlot: TimeSlot = 'morning';

    for (const line of seg.split('\n')) {
      const trimmed = line.trim();

      // Detect slot header lines — not a bullet, contains only the slot word (optionally formatted)
      // Matches: "**Morning:**", "### Afternoon", "Evening:", "Night" alone on a line
      const isSlotHeader =
        !trimmed.startsWith('-') && !trimmed.startsWith('*- ') &&
        /^[\*#\s]*(Morning|Afternoon|Evening|Night)[\*\s:–\-—]*$/i.test(trimmed);

      if (isSlotHeader) {
        const detected = detectSlot(trimmed);
        if (detected) { currentSlot = detected; continue; }
      }

      // Bullet activity
      const m = trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/);
      if (!m) continue;

      let text = m[1].trim();
      // Strip any inline slot prefix (e.g. "Morning: Visit..." or "**Afternoon** — Lunch")
      const stripped = stripSlotPrefix(text);
      const inlineSlot = stripped !== text ? detectSlot(text) : null;
      if (inlineSlot) {
        currentSlot = inlineSlot;
        text = stripped;
      }

      activities.push({
        id: `d${number}-a${activities.length}-${Math.random().toString(36).slice(2,6)}`,
        text,
        status: 'pending',
        slot: currentSlot,
      });
    }

    days.push({ number, title, activities, open: number === 1, suggestions: [], loadingMore: false });
  }

  return days;
}

/* ─── Slot container ID helpers ─────────────────────────────── */
const slotId = (dayNum: number, slot: TimeSlot) => `__slot__${dayNum}__${slot}`;
const parseSlotId = (id: UniqueIdentifier): { dayNum: number; slot: TimeSlot } | null => {
  const m = String(id).match(/^__slot__(\d+)__(\w+)$/);
  if (!m) return null;
  return { dayNum: Number(m[1]), slot: m[2] as TimeSlot };
};

/* ─── Main component ─────────────────────────────────────────── */
interface Props {
  itineraryMd: string;
  destination: string;
  tripPrompt: string;
  photos: string[];
  onPlaceHover: (e: React.MouseEvent) => void;
  onPlaceLeave: () => void;
}

export interface ItineraryHandle {
  addActivity: (text: string, dayNum: number, slot: TimeSlot) => void;
}

const EditableItinerary = forwardRef<ItineraryHandle, Props>(function EditableItinerary({
  itineraryMd, destination, tripPrompt, photos,
  onPlaceHover, onPlaceLeave,
}, ref) {
  const [days, setDays] = useState<Day[]>(() => parseItinerary(itineraryMd));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const instanceId = useId();

  /* dnd sensors — pointer (desktop) + touch (mobile) */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* Derived counters */
  const allActs  = days.flatMap(d => d.activities);
  const accepted = allActs.filter(a => a.status === 'accepted').length;
  const declined = allActs.filter(a => a.status === 'declined').length;
  const pending  = allActs.filter(a => a.status === 'pending').length;
  const total    = allActs.length;
  const progress = total > 0 ? Math.round((accepted / total) * 100) : 0;

  /* Expose addActivity to parent via ref */
  useImperativeHandle(ref, () => ({
    addActivity(text: string, dayNum: number, slot: TimeSlot) {
      setDays(prev => prev.map(d => {
        if (d.number !== dayNum) return d;
        const newActivity: Activity = {
          id: `d${dayNum}-chat-${Math.random().toString(36).slice(2,8)}`,
          text,
          status: 'pending',
          slot,
        };
        return { ...d, activities: [...d.activities, newActivity], open: true };
      }));
    },
  }));

  /* Find activity across all days */
  const findActivity = (id: UniqueIdentifier) =>
    days.flatMap(d => d.activities).find(a => a.id === id);

  /* Find which day+slot an activity lives in */
  const findContainer = (id: UniqueIdentifier): { dayNum: number; slot: TimeSlot } | null => {
    const slotParsed = parseSlotId(id);
    if (slotParsed) return slotParsed;
    for (const d of days) {
      for (const a of d.activities) {
        if (a.id === id) return { dayNum: d.number, slot: a.slot };
      }
    }
    return null;
  };

  /* ── Drag handlers ── */
  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id);

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    const from = findContainer(active.id);
    const to   = findContainer(over.id);
    if (!from || !to) return;
    if (from.dayNum !== to.dayNum) return; // cross-day drag not supported
    if (from.slot === to.slot) return;     // same slot — handled by onDragEnd

    setDays(prev => prev.map(d => {
      if (d.number !== from.dayNum) return d;
      const act = d.activities.find(a => a.id === active.id);
      if (!act) return d;

      // Remove from old slot position, insert at new slot (end)
      const without = d.activities.filter(a => a.id !== active.id);
      const slotItems = without.filter(a => a.slot === to.slot);
      const overIdx = without.findIndex(a => a.id === over.id);

      const newActs = [...without];
      const insertAt = overIdx >= 0 ? overIdx : newActs.length;
      newActs.splice(insertAt, 0, { ...act, slot: to.slot });

      return { ...d, activities: newActs };
    }));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const from = findContainer(active.id);
    const to   = findContainer(over.id);
    if (!from || !to || from.dayNum !== to.dayNum) return;

    setDays(prev => prev.map(d => {
      if (d.number !== from.dayNum) return d;

      // Cross-slot drop onto the slot droppable (empty zone)
      if (parseSlotId(over.id)) {
        return {
          ...d,
          activities: d.activities.map(a =>
            a.id === active.id ? { ...a, slot: to.slot } : a
          ),
        };
      }

      // Reorder within same slot or finalise cross-slot position
      const oldIdx = d.activities.findIndex(a => a.id === active.id);
      const newIdx = d.activities.findIndex(a => a.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return d;

      const reordered = arrayMove(d.activities, oldIdx, newIdx);
      // Ensure the moved item has the target slot
      return {
        ...d,
        activities: reordered.map((a, i) =>
          i === newIdx && a.id === active.id ? { ...a, slot: to.slot } : a
        ),
      };
    }));
  };

  /* ── Mutations ── */
  const setActivityStatus = (dayNum: number, actId: string, status: Status) =>
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        activities: d.activities.map(a =>
          a.id === actId ? { ...a, status: a.status === status ? 'pending' : status } : a
        ),
      }
    ));

  const toggleDay = (num: number) =>
    setDays(prev => prev.map(d => d.number === num ? { ...d, open: !d.open } : d));

  const fetchMoreIdeas = async (dayNum: number) => {
    const day = days.find(d => d.number === dayNum);
    if (!day || day.loadingMore) return;
    setDays(prev => prev.map(d => d.number === dayNum ? { ...d, loadingMore: true } : d));
    try {
      const res = await fetch('/api/day-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripPrompt,
          dayNumber: dayNum,
          dayTitle: day.title,
          destination,
          existingActivities: day.activities.map(a => a.text),
        }),
      });
      const data = await res.json();
      const suggestions: Suggestion[] = (data.suggestions || []).map(
        (s: Omit<Suggestion, 'id'>, i: number) => ({ ...s, id: `d${dayNum}-s${Date.now()}-${i}` })
      );
      setDays(prev => prev.map(d =>
        d.number === dayNum ? { ...d, suggestions: [...d.suggestions, ...suggestions], loadingMore: false } : d
      ));
    } catch {
      setDays(prev => prev.map(d => d.number === dayNum ? { ...d, loadingMore: false } : d));
    }
  };

  const acceptSuggestion = (dayNum: number, sug: Suggestion) => {
    // Detect slot from timing hint
    const timing   = (sug.timing || '').toLowerCase();
    const sugSlot: TimeSlot = detectSlot(timing) ?? 'afternoon';
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        suggestions: d.suggestions.filter(s => s.id !== sug.id),
        activities: [...d.activities, {
          id: `d${dayNum}-a${d.activities.length}-${Math.random().toString(36).slice(2,6)}`,
          text: `**${sug.title}** — ${sug.description}`,
          status: 'accepted',
          slot: sugSlot,
        }],
      }
    ));
  };

  const declineSuggestion = (dayNum: number, sugId: string) =>
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : { ...d, suggestions: d.suggestions.filter(s => s.id !== sugId) }
    ));

  const activeActivity = activeId ? findActivity(activeId) : null;

  return (
    <div onMouseOver={onPlaceHover} onMouseLeave={onPlaceLeave}>

      {/* ── Counters + progress bar ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px 14px', marginBottom: 16, border: '1px solid rgba(0,68,123,0.08)', boxShadow: '0 1px 8px rgba(0,68,123,0.05)' }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <StatPill color="#16A34A" bg="rgba(22,163,74,0.12)"  icon="✓">{accepted} accepted</StatPill>
          <StatPill color="#DC2626" bg="rgba(220,38,38,0.10)"  icon="✕">{declined} removed</StatPill>
          <StatPill color="#6C6D6F" bg="rgba(0,68,123,0.07)"   icon="○">{pending} to review</StatPill>
          <span style={{ marginLeft: 'auto', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: '#00447B' }}>{progress}% accepted</span>
        </div>
        <div style={{ height: 7, background: 'rgba(0,68,123,0.08)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* ── DnD context wraps all day cards ── */}
      <DndContext
        id={instanceId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {days.map((day, idx) => {
            const photo = photos.length > 0 ? photos[idx % photos.length] : null;
            const dayAccepted = day.activities.filter(a => a.status === 'accepted').length;

            return (
              <div key={day.number} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,68,123,0.08)', boxShadow: '0 2px 12px rgba(0,68,123,0.06)' }}>

                {/* Cover photo */}
                <div onClick={() => toggleDay(day.number)} style={{ cursor: 'pointer', position: 'relative' }}>
                  {photo
                    ? <img src={photo} alt={`Day ${day.number}`} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: 80, background: GRADIENTS[idx % GRADIENTS.length] }} />
                  }
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.60) 0%,rgba(0,0,0,0.10) 60%,transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '10px 14px', gap: 8 }}>
                    <span style={{ background: '#FF8210', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 100, flexShrink: 0 }}>Day {day.number}</span>
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', flex: 1, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.title}</p>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.70)', flexShrink: 0 }}>{dayAccepted}/{day.activities.length}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, flexShrink: 0, display: 'inline-block', transition: 'transform 0.2s', transform: day.open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </div>
                </div>

                {/* Time-slot sections */}
                {day.open && (
                  <div style={{ padding: '14px 14px 16px' }}>
                    {SLOTS.map(({ key, label, icon }) => {
                      const slotActs = day.activities.filter(a => a.slot === key);
                      const containerId = slotId(day.number, key);
                      return (
                        <TimeSlotSection
                          key={key}
                          containerId={containerId}
                          label={label}
                          icon={icon}
                          activities={slotActs}
                          activeId={activeId}
                          onAccept={(id) => setActivityStatus(day.number, id, 'accepted')}
                          onDecline={(id) => setActivityStatus(day.number, id, 'declined')}
                        />
                      );
                    })}

                    {/* Suggestions */}
                    {day.suggestions.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>💡 Extra Ideas for Day {day.number}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {day.suggestions.map(sug => (
                            <SuggestionCard
                              key={sug.id}
                              sug={sug}
                              onAccept={() => acceptSuggestion(day.number, sug)}
                              onDecline={() => declineSuggestion(day.number, sug.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* More ideas button */}
                    <button
                      onClick={() => fetchMoreIdeas(day.number)}
                      disabled={day.loadingMore}
                      style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: '1.5px dashed rgba(0,68,123,0.22)', borderRadius: 100, padding: '7px 16px', cursor: day.loadingMore ? 'default' : 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12, color: '#00447B', transition: 'background 0.15s', opacity: day.loadingMore ? 0.6 : 1 }}
                      onMouseEnter={e => { if (!day.loadingMore) e.currentTarget.style.background = 'rgba(0,68,123,0.04)'; }}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      {day.loadingMore ? <><InlineSpinner /> Finding ideas...</> : <><span style={{ fontSize: 15 }}>+</span> More ideas for this day</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag overlay — ghost card */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeActivity && (
            <div style={{
              padding: '9px 12px', borderRadius: 10, background: '#fff',
              border: '2px dashed #00447B', opacity: 0.85,
              boxShadow: '0 8px 28px rgba(0,68,123,0.18)',
              fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: '#333',
            }}
              dangerouslySetInnerHTML={{ __html: inlineMd(activeActivity.text) }}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

export default EditableItinerary;

/* ─── TimeSlotSection ────────────────────────────────────────── */
function TimeSlotSection({
  containerId, label, icon, activities, activeId,
  onAccept, onDecline,
}: {
  containerId: string;
  label: string;
  icon: string;
  activities: Activity[];
  activeId: UniqueIdentifier | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const ids = activities.map(a => a.id);

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Section header — never draggable */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 6px', marginBottom: 4, borderBottom: '1px solid rgba(0,68,123,0.07)' }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#00447B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>

      <SortableContext id={containerId} items={ids} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 36 }}>
          {activities.length === 0
            ? <EmptyDropZone containerId={containerId} />
            : activities.map(act => (
                <SortableActivityItem
                  key={act.id}
                  act={act}
                  isDragging={act.id === activeId}
                  onAccept={() => onAccept(act.id)}
                  onDecline={() => onDecline(act.id)}
                />
              ))
          }
        </div>
      </SortableContext>
    </div>
  );
}

/* ─── EmptyDropZone ──────────────────────────────────────────── */
import { useDroppable } from '@dnd-kit/core';
function EmptyDropZone({ containerId }: { containerId: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: containerId });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 36, borderRadius: 8,
        border: `1.5px dashed ${isOver ? '#00447B' : 'rgba(0,68,123,0.14)'}`,
        background: isOver ? 'rgba(0,68,123,0.04)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: isOver ? '#00447B' : 'rgba(0,68,123,0.30)' }}>
        {isOver ? 'Drop here' : 'No activities — drag here'}
      </span>
    </div>
  );
}

/* ─── SortableActivityItem ───────────────────────────────────── */
function SortableActivityItem({
  act, isDragging, onAccept, onDecline,
}: {
  act: Activity;
  isDragging: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: act.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex', alignItems: 'flex-start', gap: 6,
        padding: '9px 10px', borderRadius: 10,
        borderLeft: `3px solid ${act.status === 'accepted' ? '#16A34A' : act.status === 'declined' ? 'rgba(220,38,38,0.3)' : 'rgba(0,68,123,0.12)'}`,
        border: isOver ? '2px dashed #00447B' : undefined,
        background: isOver
          ? 'rgba(0,68,123,0.05)'
          : act.status === 'accepted' ? 'rgba(22,163,74,0.04)'
          : act.status === 'declined' ? 'rgba(220,38,38,0.03)'
          : '#F9FAFB',
        opacity: act.status === 'declined' ? (isDragging ? 0.2 : 0.5) : (isDragging ? 0.35 : 1),
        transition: 'background 0.15s, border 0.15s, opacity 0.15s',
      }}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{ color: 'rgba(0,68,123,0.30)', fontSize: 16, cursor: 'grab', flexShrink: 0, paddingTop: 2, userSelect: 'none', touchAction: 'none', lineHeight: 1 }}
      >⠿</span>

      {/* Text */}
      <p
        style={{ flex: 1, fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: '#333', margin: 0, textDecoration: act.status === 'declined' ? 'line-through' : 'none' }}
        dangerouslySetInnerHTML={{ __html: inlineMd(act.text) }}
      />

      {/* Accept / Decline */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2 }}>
        <RoundBtn active={act.status === 'accepted'} activeColor="#16A34A" idleColor="rgba(22,163,74,0.12)" onClick={onAccept} label="Accept">✓</RoundBtn>
        <RoundBtn active={act.status === 'declined'} activeColor="#DC2626" idleColor="rgba(220,38,38,0.10)" onClick={onDecline} label="Remove">✕</RoundBtn>
      </div>
    </div>
  );
}

/* ─── SuggestionCard ─────────────────────────────────────────── */
function SuggestionCard({ sug, onAccept, onDecline }: { sug: Suggestion; onAccept: () => void; onDecline: () => void }) {
  return (
    <div style={{ border: '1.5px solid rgba(255,130,16,0.22)', borderRadius: 12, background: 'rgba(255,247,237,0.6)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#C2410C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.title}</p>
          {sug.timing && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9A6700', margin: 0 }}>🕐 {sug.timing}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onAccept} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12 }}>✓ Add to plan</button>
          <button onClick={onDecline} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(220,38,38,0.10)', color: '#DC2626', border: 'none', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12 }}>✕</button>
        </div>
      </div>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0, padding: '0 14px 12px' }}>{sug.description}</p>
    </div>
  );
}

/* ─── Tiny reusable bits ─────────────────────────────────────── */
function StatPill({ color, bg, icon, children }: { color: string; bg: string; icon: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{icon}</span>
      {children}
    </span>
  );
}

function RoundBtn({ active, activeColor, idleColor, onClick, label, children }: { active: boolean; activeColor: string; idleColor: string; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? activeColor : idleColor, color: active ? '#fff' : activeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
      {children}
    </button>
  );
}

function InlineSpinner() {
  return <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,68,123,0.15)', borderTop: '2px solid #00447B', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />;
}
