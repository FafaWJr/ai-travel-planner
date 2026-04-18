'use client';

/**
 * PhaseCard — shown for each thematic phase on 15+ day trips.
 *
 * Displays the phase name, day range, summary, and key highlights.
 * The "Plan these days" button triggers day-by-day generation for
 * this phase via the chat (onPlanPhase callback).
 */

import type { Phase } from '@/types';

interface PhaseCardProps {
  phase: Phase;
  /** How many days in this phase already have full day plans */
  plannedDaysCount: number;
  /** Called when user taps "Plan these days" */
  onPlanPhase?: () => void;
}

export default function PhaseCard({ phase, plannedDaysCount, onPlanPhase }: PhaseCardProps) {
  const totalDays = phase.dayTo - phase.dayFrom + 1;
  const isFullyPlanned = plannedDaysCount >= totalDays;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: isFullyPlanned
        ? '1.5px solid rgba(22,163,74,0.30)'
        : '1.5px solid rgba(0,68,123,0.12)',
      boxShadow: '0 2px 12px rgba(0,68,123,0.06)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Phase header strip */}
      <div style={{
        background: isFullyPlanned
          ? 'linear-gradient(135deg,#16A34A,#15803D)'
          : 'linear-gradient(135deg,#00447B,#0369A1)',
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
              {`Days ${phase.dayFrom}–${phase.dayTo}`}
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
                ✓ Planned
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

        {/* Plan button — only shown if not fully planned and callback provided */}
        {!isFullyPlanned && onPlanPhase && (
          <button
            onClick={onPlanPhase}
            style={{
              flexShrink: 0,
              background: '#FF8210',
              color: '#fff',
              border: 'none',
              borderRadius: 100,
              padding: '8px 16px',
              fontFamily: "'Poppins',sans-serif",
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,130,16,0.35)',
              transition: 'opacity 0.15s, transform 0.1s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            Plan these days
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px 16px' }}>
        {/* Summary */}
        <p style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: 14,
          lineHeight: 1.65,
          color: '#444',
          margin: '0 0 12px',
        }}>
          {phase.summary}
        </p>

        {/* Highlights */}
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

        {/* Progress indicator */}
        {totalDays > 0 && (
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
    </div>
  );
}
