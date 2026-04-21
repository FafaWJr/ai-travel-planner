'use client';

import { useState } from 'react';
import type { Phase, TripLengthMode } from '@/types';

interface PhaseCardProps {
  phase: Phase;
  plannedDaysCount: number;
  /** Returns a promise that resolves when expansion is complete (success or failure). */
  onPlanPhase?: () => Promise<void>;
  /** R4: Called when user selects "Regenerate phase" from the three-dot menu. */
  onRegeneratePhase?: (phaseId: string) => void;
  /** R4: Whether the regen affordance is enabled. */
  regenEnabled?: boolean;
  /** R4: Whether this phase has any planned activity content (shows three-dot menu). */
  isPlanned?: boolean;
  /** R6: Controls phase card behaviour — medium shows dismiss X, long shows "Plan these days". */
  tripLengthMode?: TripLengthMode;
  /** R6: Called when user clicks the X button in medium mode to dismiss all phase cards. */
  onDismissPhases?: () => void;
}

export default function PhaseCard({ phase, plannedDaysCount, onPlanPhase, onRegeneratePhase, regenEnabled = false, isPlanned = false, tripLengthMode = 'long', onDismissPhases }: PhaseCardProps) {
  const totalDays = phase.dayTo - phase.dayFrom + 1;
  const isFullyPlanned = plannedDaysCount >= totalDays;
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = async () => {
    if (!onPlanPhase || isPlanning) return;
    setIsPlanning(true);
    setError(null);
    try {
      await onPlanPhase();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not plan these days. Please try again.';
      setError(msg);
    } finally {
      setIsPlanning(false);
    }
  };

  const headerBg = isFullyPlanned
    ? 'linear-gradient(135deg,#16A34A,#15803D)'
    : isPlanning
      ? 'linear-gradient(135deg,#FF8210,#E66F00)'
      : 'linear-gradient(135deg,#00447B,#0369A1)';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: isFullyPlanned
        ? '1.5px solid rgba(22,163,74,0.30)'
        : isPlanning
          ? '1.5px solid rgba(255,130,16,0.40)'
          : '1.5px solid rgba(0,68,123,0.12)',
      boxShadow: '0 2px 12px rgba(0,68,123,0.06)',
      overflow: 'hidden',
      transition: 'border-color 0.2s, opacity 0.2s',
    }}>
      <div style={{
        background: headerBg,
        padding: '14px 18px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{
              background: 'rgba(255,255,255,0.20)',
              color: '#fff',
              fontFamily: "'Inter',sans-serif",
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: 100,
              letterSpacing: 0.3,
            }}>
              {`Days ${phase.dayFrom}-${phase.dayTo}`}
            </span>
            {isFullyPlanned && (
              <span style={{
                background: 'rgba(255,255,255,0.20)',
                color: '#fff',
                fontSize: 10,
                fontFamily: "'Inter',sans-serif",
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 100,
              }}>
                Planned
              </span>
            )}
            {isPlanning && (
              <span style={{
                background: 'rgba(255,255,255,0.20)',
                color: '#fff',
                fontSize: 10,
                fontFamily: "'Inter',sans-serif",
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 100,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  borderTop: '1.5px solid #fff',
                  animation: 'phaseSpin 0.7s linear infinite',
                }} />
                Planning
              </span>
            )}
          </div>
          <h3 style={{
            fontFamily: "'Poppins',sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: '#fff',
            margin: 0,
            letterSpacing: 0.1,
          }}>
            {phase.label}
          </h3>
        </div>

        {tripLengthMode === 'medium' && onDismissPhases && (
          <button
            onClick={onDismissPhases}
            title="Hide phase overview"
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', padding: 6,
              cursor: 'pointer', color: '#fff', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {isPlanned && regenEnabled && onRegeneratePhase && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              title="Phase options"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', padding: 6,
                cursor: 'pointer', color: '#fff', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setMenuOpen(false)} />
                <div style={{
                  position: 'absolute', top: 34, right: 0, zIndex: 101,
                  background: '#fff', border: '1px solid rgba(0,68,123,0.12)',
                  borderRadius: 8, boxShadow: '0 8px 24px rgba(0,20,60,0.12)',
                  minWidth: 180, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => { setMenuOpen(false); onRegeneratePhase(phase.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '10px 14px', border: 'none', background: 'transparent',
                      color: '#00447B', fontFamily: "'Poppins', sans-serif",
                      fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,68,123,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M14 8a6 6 0 1 1-2.5-4.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Regenerate phase
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tripLengthMode !== 'medium' && !isFullyPlanned && onPlanPhase && (
          <button
            onClick={handleClick}
            disabled={isPlanning}
            style={{
              flexShrink: 0,
              background: isPlanning ? 'rgba(255,255,255,0.20)' : '#FF8210',
              color: '#fff',
              border: 'none',
              borderRadius: 100,
              padding: '8px 16px',
              fontFamily: "'Poppins',sans-serif",
              fontWeight: 700,
              fontSize: 12,
              cursor: isPlanning ? 'default' : 'pointer',
              boxShadow: isPlanning ? 'none' : '0 2px 8px rgba(255,130,16,0.35)',
              transition: 'opacity 0.15s, transform 0.1s',
              whiteSpace: 'nowrap',
              opacity: isPlanning ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => { if (!isPlanning) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if (!isPlanning) e.currentTarget.style.opacity = '1'; }}
          >
            {isPlanning ? (
              <>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  borderTop: '1.5px solid #fff',
                  animation: 'phaseSpin 0.7s linear infinite',
                }} />
                Planning...
              </>
            ) : (
              'Plan these days'
            )}
          </button>
        )}
      </div>

      <div style={{ padding: '14px 18px 16px' }}>
        <p style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: 14,
          lineHeight: 1.65,
          color: '#444',
          margin: '0 0 12px',
        }}>
          {phase.summary}
        </p>

        {phase.highlights.length > 0 && (
          <div>
            <p style={{
              fontFamily: "'Poppins',sans-serif",
              fontWeight: 600,
              fontSize: 11,
              color: '#00447B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              margin: '0 0 8px',
            }}>
              Highlights
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {phase.highlights.map((hl, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(0,68,123,0.06)',
                    color: '#00447B',
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: 100,
                    border: '1px solid rgba(0,68,123,0.10)',
                  }}
                >
                  {hl}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.20)',
            borderRadius: 8,
            color: '#B91C1C',
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {tripLengthMode !== 'medium' && totalDays > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#6C6D6F' }}>
                {plannedDaysCount} of {totalDays} days planned
              </span>
              <span style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: isFullyPlanned ? '#16A34A' : '#00447B',
              }}>
                {Math.round((plannedDaysCount / totalDays) * 100)}%
              </span>
            </div>
            <div style={{
              height: 4,
              background: 'rgba(0,68,123,0.08)',
              borderRadius: 100,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.round((plannedDaysCount / totalDays) * 100)}%`,
                background: isFullyPlanned
                  ? 'linear-gradient(90deg,#16A34A,#4ADE80)'
                  : 'linear-gradient(90deg,#00447B,#0369A1)',
                borderRadius: 100,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes phaseSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
