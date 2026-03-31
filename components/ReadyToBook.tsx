import React from 'react';

interface ReadyToBookProps {
  destination: string;
}

const partners = [
  {
    category: 'Hotels & Apartments',
    name: 'Booking.com',
    description: 'Compare 1M+ properties. Free cancellation on most.',
    cta: 'Find Accommodation →',
    color: '#00447B',
    icon: '🏨',
    href: 'http://www.awin1.com/awclick.php?mid=18118&id=2825924',
  },
  {
    category: 'Tours & Experiences',
    name: 'GetYourGuide',
    description: 'Top-rated tours and activities led by local experts.',
    cta: 'Discover Activities →',
    color: '#FF8210',
    icon: '🎭',
    href: 'https://www.getyourguide.com',
  },
  {
    category: 'Unique Stays',
    name: 'Airbnb',
    description: 'Find homes, apartments and authentic local experiences.',
    cta: 'Browse Unique Stays →',
    color: '#993556',
    icon: '🏠',
    href: 'https://www.airbnb.com',
  },
  {
    category: 'Guided Experiences',
    name: 'Viator',
    description: 'Premium tours, skip-the-line tickets, private guides.',
    cta: 'Browse Experiences →',
    color: '#0F6E56',
    icon: '⭐',
    href: 'https://www.viator.com',
  },
  {
    category: 'Car Rental',
    name: 'Rentalcars.com',
    description: 'Compare all major providers. Best price guarantee.',
    cta: 'Compare Car Rentals →',
    color: '#185FA5',
    icon: '🚗',
    href: 'https://www.rentalcars.com',
  },
];

export default function ReadyToBook({ destination }: ReadyToBookProps) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', fontFamily: 'Inter, sans-serif', maxWidth: '860px', margin: '32px auto 0' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#00447B', padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
          ✈️ Ready to Book?
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
          Best deals for <strong style={{ color: '#fff' }}>{destination}</strong>, handpicked partners for your trip.
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '20px', backgroundColor: '#fff' }}>

        {/* Top row: 3 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {partners.slice(0, 3).map((p) => (
            <div key={p.name} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fff' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: p.color }}>
                {p.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {p.icon}
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#111827' }}>{p.name}</p>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5, flex: 1 }}>{p.description}</p>
              <a href={p.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: p.color, textDecoration: 'none', marginTop: '4px' }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Bottom row: 2 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
          {partners.slice(3).map((p) => (
            <div key={p.name} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fff' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: p.color }}>
                {p.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {p.icon}
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#111827' }}>{p.name}</p>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5, flex: 1 }}>{p.description}</p>
              <a href={p.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: p.color, textDecoration: 'none', marginTop: '4px' }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e5e7eb' }}>
          We may earn a small commission when you book through these links, at no extra cost to you.
        </p>

      </div>
    </div>
  );
}
