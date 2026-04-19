'use client';
import { useState } from 'react';

type Props = {
  isOpen: boolean;
  mode: 'day' | 'phase';
  dayNumber?: number;
  phaseName?: string;
  dayRange?: [number, number];
  hasAcceptedActivities: boolean;
  isSubmitting: boolean;
  onConfirm: (opts: { userHint: string; keepAccepted: boolean }) => void;
  onCancel: () => void;
};

export default function RegenerationModal({
  isOpen, mode, dayNumber, phaseName, dayRange,
  hasAcceptedActivities, isSubmitting,
  onConfirm, onCancel,
}: Props) {
  const [userHint, setUserHint] = useState('');
  const [keepAccepted, setKeepAccepted] = useState(false);

  if (!isOpen) return null;

  const title = mode === 'day' ? `Regenerate Day ${dayNumber}` : `Regenerate "${phaseName}"`;
  const subtitle = mode === 'day'
    ? `Luna will create a fresh take on Day ${dayNumber}.`
    : `Luna will create fresh activities for all ${dayRange ? dayRange[1] - dayRange[0] + 1 : '?'} days in this phase.`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,20,60,0.45)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,20,60,0.25)',
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(0,68,123,0.08)' }}>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20,
            color: '#00447B', margin: 0, lineHeight: 1.3,
          }}>
            {title}
          </h2>
          <p style={{ fontSize: 14, color: '#6C6D6F', margin: '6px 0 0', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block', fontFamily: "'Poppins', sans-serif", fontWeight: 600,
              fontSize: 12, color: '#00447B', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Anything specific? (optional)
            </label>
            <textarea
              value={userHint}
              onChange={(e) => setUserHint(e.target.value)}
              placeholder={mode === 'day'
                ? 'e.g. "Make it more relaxed" or "Focus on local food"'
                : 'e.g. "Add more nature activities" or "Slower pace overall"'}
              disabled={isSubmitting}
              rows={3}
              maxLength={300}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 8,
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
                color: '#333', background: isSubmitting ? '#F4F7FB' : '#fff',
              }}
            />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
              {userHint.length}/300 characters
            </p>
          </div>

          {mode === 'day' && hasAcceptedActivities && (
            <div>
              <label style={{
                display: 'block', fontFamily: "'Poppins', sans-serif", fontWeight: 600,
                fontSize: 12, color: '#00447B', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                Accepted activities
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: false, title: 'Replace everything', subtitle: 'Fresh start. Your accepted activities will be cleared.' },
                  { value: true,  title: 'Keep my accepted picks', subtitle: 'Luna regenerates the rest around them.' },
                ].map(opt => (
                  <label
                    key={String(opt.value)}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 12px',
                      border: '1.5px solid ' + (keepAccepted === opt.value ? '#FF8210' : 'rgba(0,68,123,0.15)'),
                      borderRadius: 8, cursor: isSubmitting ? 'default' : 'pointer',
                      background: keepAccepted === opt.value ? 'rgba(255,130,16,0.04)' : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio" name="accepted-mode" checked={keepAccepted === opt.value}
                      onChange={() => setKeepAccepted(opt.value)} disabled={isSubmitting}
                      style={{ marginTop: 2, accentColor: '#FF8210' }}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 600, color: '#00447B', fontSize: 14 }}>
                        {opt.title}
                      </span>
                      <span style={{ fontSize: 12, color: '#6C6D6F' }}>{opt.subtitle}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === 'phase' && (
            <div style={{
              background: '#FFF4EA', border: '1px solid #FFD0A0', borderRadius: 8,
              padding: '10px 12px', color: '#CC6200', fontSize: 13, lineHeight: 1.5,
            }}>
              All activities in this phase will be replaced. Accepted activities across all days in this phase will be cleared.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(0,68,123,0.08)',
          display: 'flex', gap: 12, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel} disabled={isSubmitting}
            style={{
              padding: '10px 20px', border: '1.5px solid rgba(0,68,123,0.2)',
              background: '#fff', color: '#00447B', borderRadius: 100,
              fontWeight: 500, fontSize: 14, fontFamily: "'Poppins', sans-serif",
              cursor: isSubmitting ? 'default' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ userHint: userHint.trim(), keepAccepted })}
            disabled={isSubmitting}
            style={{
              padding: '10px 24px', border: 'none',
              background: isSubmitting ? 'rgba(255,130,16,0.6)' : '#FF8210',
              color: '#fff', borderRadius: 100,
              fontWeight: 600, fontSize: 14, fontFamily: "'Poppins', sans-serif",
              cursor: isSubmitting ? 'default' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {isSubmitting && (
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTop: '2px solid #fff',
                animation: 'regenSpin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            )}
            {isSubmitting ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>
      <style>{`@keyframes regenSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
