'use client';
import type { AcceptedHotel } from './StayTab';

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
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/* Build a fully self-contained HTML string and open it in a new window to print */
function openPrintWindow(days: FinalDay[], destination: string, acceptedHotels: AcceptedHotel[] = []) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/luna_letsgo_bigger_3.PNG`;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const activeDays = days.filter(d => d.activities.some(a => a.status !== 'declined'));

  const daysHtml = activeDays.map(day => {
    const dayActs = day.activities.filter(a => a.status !== 'declined');
    if (!dayActs.length) return '';

    const slotsHtml = SLOTS.map(slot => {
      const slotActs = dayActs.filter(a => a.slot === slot);
      if (!slotActs.length) return '';
      return `
        <div class="slot">
          <div class="slot-header">
            <span class="slot-icon">${SLOT_ICONS[slot]}</span>
            <span class="slot-label">${SLOT_LABELS[slot]}</span>
          </div>
          ${slotActs.map(act => `
            <div class="activity ${act.status === 'accepted' ? 'accepted' : ''}">
              <p>${inlineMd(act.text)}</p>
            </div>
          `).join('')}
        </div>`;
    }).join('');

    return `
      <div class="day">
        <div class="day-header">
          <span class="day-badge">Day ${day.number}</span>
          <h2 class="day-title">${day.title}</h2>
          ${day.confirmed ? '<span class="confirmed">✓ Confirmed</span>' : ''}
        </div>
        ${slotsHtml}
      </div>`;
  }).join('');

  // Build accommodation section HTML
  const hotelsHtml = acceptedHotels.length > 0 ? `
    <div class="section-break">
      <div class="section-title">🏨 Accommodation</div>
    </div>
    ${acceptedHotels.map(({ hotel, segment }) => `
      <div class="hotel-block">
        <div class="hotel-header">
          <div>
            <div class="hotel-name">${hotel.name} ${'★'.repeat(hotel.stars)}</div>
            <div class="hotel-meta">📍 ${hotel.neighborhood} · ${segment.label}</div>
          </div>
          <div class="hotel-price">${hotel.priceRange}</div>
        </div>
        <div class="hotel-dates">Check-in: ${segment.checkIn || '—'} &nbsp;→&nbsp; Check-out: ${segment.checkOut || '—'}</div>
        <div class="hotel-desc">${hotel.description}</div>
        <div class="hotel-amenities">${hotel.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}</div>
        <div class="hotel-note">Recommended by Luna Let's Go</div>
      </div>
    `).join('')}
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${destination} — Luna Let's Go Itinerary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      color: #333;
      background: #fff;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 40px 64px;
    }

    /* ── Header ── */
    .print-header {
      text-align: center;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 2px solid rgba(0,68,123,0.12);
    }
    .print-header .logo {
      height: 64px;
      width: auto;
      margin-bottom: 20px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    .eyebrow {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 10px;
      color: #FF8210;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      margin-bottom: 10px;
    }
    .main-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 30px;
      color: #00447B;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #9CA3AF;
    }

    /* ── Day block ── */
    .day {
      margin-bottom: 36px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .day-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(0,68,123,0.10);
    }
    .day-badge {
      background: #00447B;
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 11px;
      padding: 4px 14px;
      border-radius: 100px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .day-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 19px;
      color: #111;
      flex: 1;
    }
    .confirmed {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #16A34A;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Time slot ── */
    .slot {
      margin-bottom: 16px;
    }
    .slot-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(0,68,123,0.06);
    }
    .slot-icon { font-size: 13px; }
    .slot-label {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 10px;
      color: #00447B;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    /* ── Activity ── */
    .activity {
      border-left: 3px solid rgba(0,68,123,0.15);
      padding: 5px 0 5px 14px;
      margin-bottom: 8px;
    }
    .activity.accepted {
      border-left-color: #16A34A;
    }
    .activity p {
      font-family: 'Inter', sans-serif;
      font-size: 13.5px;
      line-height: 1.7;
      color: #333;
    }
    .activity strong { font-weight: 700; }

    /* ── Footer ── */
    .print-footer {
      margin-top: 52px;
      padding-top: 20px;
      border-top: 2px solid rgba(0,68,123,0.10);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .print-footer .logo-small {
      height: 36px;
      width: auto;
      opacity: 0.55;
    }
    .print-footer p {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #9CA3AF;
    }

    /* ── Accommodation section ── */
    .section-break {
      margin: 40px 0 20px;
      padding-top: 32px;
      border-top: 2px solid rgba(0,68,123,0.10);
    }
    .section-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #00447B;
      margin-bottom: 16px;
    }
    .hotel-block {
      background: #F8FAFC;
      border: 1.5px solid rgba(0,68,123,0.10);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .hotel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 6px;
    }
    .hotel-name {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 15px;
      color: #111;
      margin-bottom: 3px;
    }
    .hotel-meta {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #6C6D6F;
    }
    .hotel-price {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 13px;
      color: #00447B;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .hotel-dates {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #555;
      margin-bottom: 6px;
    }
    .hotel-desc {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #444;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .hotel-amenities {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 6px;
    }
    .amenity {
      background: rgba(0,68,123,0.07);
      color: #00447B;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 100px;
    }
    .hotel-note {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #9CA3AF;
      font-style: italic;
    }

    @page { margin: 16mm; size: A4 portrait; }
  </style>
</head>
<body>
  <div class="page">

    <div class="print-header">
      <img class="logo" src="${logoUrl}" alt="Luna Let's Go" />
      <div class="eyebrow">Your personalised itinerary</div>
      <div class="main-title">${destination}</div>
      <div class="subtitle">Crafted by Luna Let's Go &middot; ${date}</div>
    </div>

    ${daysHtml}

    ${hotelsHtml}

    <div class="print-footer">
      <img class="logo-small" src="${logoUrl}" alt="Luna Let's Go" />
      <p>lunaletsgo.com &middot; AI-powered travel planning</p>
    </div>

  </div>

  <script>
    // Wait for images + fonts, then trigger print dialog
    Promise.all([
      document.fonts.ready,
      new Promise(resolve => {
        var img = document.querySelector('.logo');
        if (!img || img.complete) return resolve();
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      })
    ]).then(function() {
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=860,height=760');
  if (!win) {
    alert('Please allow pop-ups in your browser to use the Print / Save PDF feature.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/* ── Modal component ── */
export default function FinalItineraryModal({
  days, destination, acceptedHotels = [], onClose,
}: {
  days: FinalDay[];
  destination: string;
  acceptedHotels?: AcceptedHotel[];
  onClose: () => void;
}) {
  const activeDays = days.filter(d => d.activities.some(a => a.status !== 'declined'));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9100, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9200, background: '#F4F7FB', overflowY: 'auto',
        fontFamily: "'Inter',sans-serif",
      }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,68,123,0.10)',
          padding: '12px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 52, width: 'auto' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => openPrintWindow(days, destination, acceptedHotels)}
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

        {/* Preview body */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 40px 80px' }}>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 60, width: 'auto', marginBottom: 20 }} />
            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, color: '#FF8210', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Your personalised itinerary
            </p>
            <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 32, color: '#00447B', margin: '0 0 8px' }}>
              {destination}
            </h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#9CA3AF' }}>
              Crafted by Luna Let&apos;s Go &middot; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Days */}
          {activeDays.map(day => {
            const dayActs = day.activities.filter(a => a.status !== 'declined');
            if (!dayActs.length) return null;
            return (
              <div key={day.number} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,68,123,0.08)', boxShadow: '0 2px 12px rgba(0,68,123,0.05)', padding: '24px 28px', marginBottom: 16 }}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: '1.5px solid rgba(0,68,123,0.08)' }}>
                  <span style={{ background: '#00447B', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, padding: '4px 14px', borderRadius: 100, flexShrink: 0 }}>Day {day.number}</span>
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 18, color: '#111', margin: 0, flex: 1 }}>{day.title}</h2>
                  {day.confirmed && <span style={{ fontSize: 11, color: '#16A34A', fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>✓ Confirmed</span>}
                </div>

                {/* Slots */}
                {SLOTS.map(slot => {
                  const slotActs = dayActs.filter(a => a.slot === slot);
                  if (!slotActs.length) return null;
                  return (
                    <div key={slot} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>{SLOT_ICONS[slot]}</span>
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#00447B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{SLOT_LABELS[slot]}</span>
                      </div>
                      {slotActs.map(act => (
                        <div key={act.id} style={{ borderLeft: `3px solid ${act.status === 'accepted' ? '#16A34A' : 'rgba(0,68,123,0.15)'}`, paddingLeft: 14, marginBottom: 8, paddingTop: 3, paddingBottom: 3 }}>
                          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, lineHeight: 1.7, color: '#333', margin: 0 }}
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
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1.5px solid rgba(0,68,123,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 36, width: 'auto', opacity: 0.55 }} />
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF' }}>lunaletsgo.com · AI-powered travel planning</p>
          </div>
        </div>
      </div>
    </>
  );
}
