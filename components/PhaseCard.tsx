'use client';

import { useState, useEffect, useRef } from 'react';
import type { Phase, TripLengthMode } from '@/types';

interface PhaseCardProps {
  phase: Phase;
  plannedDaysCount: number;
  tripDays?: number;
  /** R5.1: Whether this phase is collapsed. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Generate/regenerate plan (EditableItinerary handles confirm if days exist). */
  onGeneratePlan?: () => Promise<void>;
  /** Inline label edit. */
  onEditLabel?: (newLabel: string) => void;
  /** Inline range edit. Returns error message, or null on success (sync or async). */
  onEditRange?: (from: number, to: number) => string | null | Promise<string | null>;
  /** Delete this phase. */
  onDeletePhase?: () => void;
  /** Medium trips: dismiss all phase cards. */
  onDismissPhases?: () => void;
  tripLengthMode?: TripLengthMode;
  /** Auto-open label editor (for newly created phases). */
  initialLabelEditing?: boolean;
}

export default function PhaseCard({
  phase,
  plannedDaysCount,
  tripDays = 365,
  collapsed = false,
  onToggleCollapse,
  onGeneratePlan,
  onEditLabel,
  onEditRange,
  onDeletePhase,
  onDismissPhases,
  tripLengthMode = 'long',
  initialLabelEditing = false,
}: PhaseCardProps) {
  const totalDays = phase.dayTo - phase.dayFrom + 1;
  const isFullyPlanned = plannedDaysCount >= totalDays;
  const hasPlannedDays = plannedDaysCount > 0;

  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Inline label editing
  const [editingLabel, setEditingLabel] = useState(initialLabelEditing);
  const [labelDraft, setLabelDraft] = useState(phase.label);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Inline range editing
  const [editingRange, setEditingRange] = useState(false);
  const [fromDraft, setFromDraft] = useState(phase.dayFrom);
  const [toDraft, setToDraft] = useState(phase.dayTo);
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Sync drafts when phase prop changes externally
  useEffect(() => { setLabelDraft(phase.label); }, [phase.label]);
  useEffect(() => { setFromDraft(phase.dayFrom); setToDraft(phase.dayTo); }, [phase.dayFrom, phase.dayTo]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editingLabel && labelInputRef.current) labelInputRef.current.focus();
  }, [editingLabel]);

  const saveLabel = () => {
    const trimmed = labelDraft.trim();
    if (trimmed && trimmed !== phase.label) onEditLabel?.(trimmed);
    else setLabelDraft(phase.label);
    setEditingLabel(false);
  };

  const saveRange = async () => {
    const result = onEditRange?.(fromDraft, toDraft);
    const err = result instanceof Promise ? await result : result;
    if (err) {
      setRangeError(err);
      setFromDraft(phase.dayFrom);
      setToDraft(phase.dayTo);
    } else {
      setRangeError(null);
      setEditingRange(false);
    }
  };

  const handleGenerate = async () => {
    if (!onGeneratePlan || isGenerating) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      await onGeneratePlan();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Could not plan these days. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const headerBg = isFullyPlanned
    ? 'linear-gradient(135deg,#16A34A,#15803D)'
    : isGenerating
      ? 'linear-gradient(135deg,#FF8210,#E66F00)'
      : 'linear-gradient(135deg,#00447B,#0369A1)';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: isFullyPlanned
        ? '1.5px solid rgba(22,163,74,0.30)'
        : isGenerating
          ? '1.5px solid rgba(255,130,16,0.40)'
          : '1.5px solid rgba(0,68,123,0.12)',
      boxShadow: '0 2px 12px rgba(0,68,123,0.06)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ background: headerBg, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>

        {/* Left: range badge + editable label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Day range badge (clickable to edit) */}
          {editingRange ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter',sans-serif", fontSize: 12 }}>Days</span>
              <input
                type="number" min={1} max={tripDays} value={fromDraft}
                onChange={e => setFromDraft(parseInt(e.target.value) || 1)}
                style={{ width: 52, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.5)', background: '#fff', color: '#00447B', fontWeight: 600, textAlign: 'center', fontSize: 12 }}
              />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>to</span>
              <input
                type="number" min={1} max={tripDays} value={toDraft}
                onChange={e => setToDraft(parseInt(e.target.value) || 1)}
                onKeyDown={e => { if (e.key === 'Enter') saveRange(); if (e.key === 'Escape') { setEditingRange(false); setFromDraft(phase.dayFrom); setToDraft(phase.dayTo); setRangeError(null); } }}
                style={{ width: 52, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.5)', background: '#fff', color: '#00447B', fontWeight: 600, textAlign: 'center', fontSize: 12 }}
              />
              <button onClick={saveRange} style={{ background: '#FF8210', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditingRange(false); setFromDraft(phase.dayFrom); setToDraft(phase.dayTo); setRangeError(null); }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => onEditRange ? setEditingRange(true) : undefined}
              style={{
                background: 'rgba(255,255,255,0.20)', color: '#fff', border: 'none',
                borderRadius: 100, padding: '3px 12px', marginBottom: 5,
                cursor: onEditRange ? 'pointer' : 'default',
                fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600,
                letterSpacing: 0.3, transition: 'background 150ms', display: 'inline-block',
              }}
              onMouseEnter={e => { if (onEditRange) e.currentTarget.style.background = 'rgba(255,255,255,0.32)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }}
              title={onEditRange ? 'Click to change day range' : undefined}
            >
              {`Days ${phase.dayFrom}–${phase.dayTo}`}
              {isFullyPlanned && <span style={{ marginLeft: 6, opacity: 0.85 }}>· Planned</span>}
              {isGenerating && <span style={{ marginLeft: 6, opacity: 0.85 }}>· Planning...</span>}
            </button>
          )}

          {/* Editable label */}
          {editingLabel ? (
            <input
              ref={labelInputRef}
              type="text"
              value={labelDraft}
              onChange={e => setLabelDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={e => {
                if (e.key === 'Enter') saveLabel();
                if (e.key === 'Escape') { setLabelDraft(phase.label); setEditingLabel(false); }
              }}
              style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 16, color: '#fff',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.50)',
                borderRadius: 8, padding: '4px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
            />
          ) : (
            <h3
              onClick={() => onEditLabel ? setEditingLabel(true) : undefined}
              title={onEditLabel ? 'Click to rename' : undefined}
              style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 16, color: '#fff',
                margin: 0, padding: '2px 4px', marginLeft: -4, borderRadius: 6,
                cursor: onEditLabel ? 'pointer' : 'default', transition: 'background 150ms',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
              onMouseEnter={e => { if (onEditLabel) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {phase.label}
            </h3>
          )}
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
          {/* Generate / Regenerate button */}
          {onGeneratePlan && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                background: isGenerating ? 'rgba(255,255,255,0.20)' : '#FF8210',
                color: '#fff', border: 'none', borderRadius: 100,
                padding: '6px 14px', fontFamily: "'Poppins',sans-serif",
                fontWeight: 700, fontSize: 11, cursor: isGenerating ? 'default' : 'pointer',
                whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5,
                boxShadow: isGenerating ? 'none' : '0 2px 6px rgba(255,130,16,0.35)',
                opacity: isGenerating ? 0.8 : 1, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { if (!isGenerating) e.currentTarget.style.opacity = '1'; }}
            >
              {isGenerating
                ? <><span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.4)', borderTop: '1.5px solid #fff', animation: 'phaseSpin 0.7s linear infinite', display: 'inline-block' }} />Planning...</>
                : hasPlannedDays ? 'Regenerate' : 'Plan these days'
              }
            </button>
          )}

          {/* Delete button */}
          {onDeletePhase && (
            <button onClick={onDeletePhase} title="Delete this phase"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', padding: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.80)', borderRadius: 7, display: 'flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M6 4V2h4v2M5 4v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Collapse caret */}
          <button onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', padding: 5, cursor: 'pointer', color: '#fff', borderRadius: 7, display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 200ms' }}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body (hidden when collapsed) */}
      {!collapsed && (
        <div style={{ padding: '12px 16px 14px' }}>
          {rangeError && (
            <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.20)', borderRadius: 8, color: '#B91C1C', fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
              {rangeError}
            </div>
          )}
          {genError && (
            <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.20)', borderRadius: 8, color: '#B91C1C', fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
              {genError}
            </div>
          )}

          {phase.summary ? (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.6, color: '#444', margin: '0 0 10px' }}>
              {phase.summary}
            </p>
          ) : null}

          {phase.highlights.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {phase.highlights.map((hl, i) => (
                <span key={i} style={{ background: 'rgba(0,68,123,0.06)', color: '#00447B', fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(0,68,123,0.10)' }}>
                  {hl}
                </span>
              ))}
            </div>
          )}

          {/* Progress bar (long mode) */}
          {tripLengthMode !== 'medium' && totalDays > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#6C6D6F' }}>
                  {plannedDaysCount} of {totalDays} days planned
                </span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600, color: isFullyPlanned ? '#16A34A' : '#00447B' }}>
                  {Math.round((plannedDaysCount / totalDays) * 100)}%
                </span>
              </div>
              <div style={{ height: 3, background: 'rgba(0,68,123,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((plannedDaysCount / totalDays) * 100)}%`, background: isFullyPlanned ? 'linear-gradient(90deg,#16A34A,#4ADE80)' : 'linear-gradient(90deg,#00447B,#0369A1)', borderRadius: 100, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes phaseSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
