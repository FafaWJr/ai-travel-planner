'use client';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
type Status = 'pending' | 'accepted' | 'declined';

export interface FinalActivity {
  id: string;
  text: string;
  slot: TimeSlot;
  status: Status;
}

export interface FinalDay {
  number: number;
  title: string;
  activities: FinalActivity[];
  confirmed: boolean;
}

const SLOT_ICONS: Record<TimeSlot, string> = {
  morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙',
};
const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
};
const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];

function inlineMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default function FinalItineraryModal({
  days, destination, onClose,
}: {
  days: FinalDay[];
  destination: string;
  onClose: () => void;
}) {
  const activeDays = days.filter(d => d.activities.some(a => a.status !== 'declined'));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 9100, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal sheet */}
      <div
        id="luna-print-root"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9200, background: '#fff', overflowY: 'auto',
          fontFamily: "'Inter',sans-serif",
        }}
      >
        {/* Sticky top bar — hidden on print */}
        <div
          className="no-print"
          style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,68,123,0.10)',
            padding: '12px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 52, width: 'auto' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#FF8210', color: '#fff', border: 'none',
                borderRadius: 100, padding: '10px 22px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              🖨️ Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,68,123,0.07)', color: '#00447B',
                border: 'none', borderRadius: 100, padding: '10px 20px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Print body */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '44px 40px 80px' }}>

          {/* Title block */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11,
              color: '#FF8210', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10,
            }}>
              Your personalised itinerary
            </p>
            <h1 style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 34,
              color: '#00447B', margin: '0 0 10px',
            }}>
              {destination}
            </h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#9CA3AF' }}>
              Crafted by Luna Let&apos;s Go · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Day sections */}
          {activeDays.map(day => {
            const dayActs = day.activities.filter(a => a.status !== 'declined');
            if (dayActs.length === 0) return null;
            return (
              <div key={day.number} style={{ marginBottom: 40, pageBreakInside: 'avoid' as const }}>
                {/* Day header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
                  paddingBottom: 12, borderBottom: '2px solid rgba(0,68,123,0.10)',
                }}>
                  <span style={{
                    background: '#00447B', color: '#fff',
                    fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12,
                    padding: '4px 14px', borderRadius: 100, flexShrink: 0,
                  }}>
                    Day {day.number}
                  </span>
                  <h2 style={{
                    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 20,
                    color: '#111', margin: 0, flex: 1,
                  }}>
                    {day.title}
                  </h2>
                  {day.confirmed && (
                    <span style={{
                      fontSize: 11, color: '#16A34A',
                      fontFamily: "'Inter',sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                    }}>
                      ✓ Confirmed
                    </span>
                  )}
                </div>

                {/* Time slots */}
                {SLOTS.map(slot => {
                  const slotActs = dayActs.filter(a => a.slot === slot);
                  if (slotActs.length === 0) return null;
                  return (
                    <div key={slot} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>{SLOT_ICONS[slot]}</span>
                        <span style={{
                          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11,
                          color: '#00447B', textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>
                          {SLOT_LABELS[slot]}
                        </span>
                      </div>
                      {slotActs.map(act => (
                        <div
                          key={act.id}
                          style={{
                            borderLeft: `3px solid ${act.status === 'accepted' ? '#16A34A' : 'rgba(0,68,123,0.18)'}`,
                            paddingLeft: 14, marginBottom: 10,
                            background: act.status === 'accepted' ? 'rgba(22,163,74,0.03)' : 'transparent',
                            borderRadius: '0 6px 6px 0', paddingTop: 4, paddingBottom: 4,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.65,
                              color: '#333', margin: 0,
                            }}
                            dangerouslySetInnerHTML={{ __html: inlineMd(act.text) }}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Footer */}
          <div style={{
            marginTop: 52, paddingTop: 24,
            borderTop: '2px solid rgba(0,68,123,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 38, width: 'auto', opacity: 0.65 }} />
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF' }}>
              lunaletsgo.com · AI-powered travel planning
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #luna-print-root { position: static !important; overflow: visible !important; }
          body > *:not(#luna-print-root) { display: none !important; }
          @page { margin: 18mm; }
        }
      `}</style>
    </>
  );
}
