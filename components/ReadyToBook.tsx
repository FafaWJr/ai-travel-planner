'use client';
import { Smartphone } from 'lucide-react';

export interface ReadyToBookProps {
  destination: string;
}

const PARTNERS = [
  {
    id: 'booking',
    category: 'Hotels & Apartments',
    emoji: '🏨',
    name: 'Booking.com',
    desc: 'Compare 1M+ properties. Free cancellation on most.',
    cta: 'Find Accommodation',
    color: '#00447B',
    href: 'http://www.awin1.com/awclick.php?mid=18118&id=2825924',
  },
  {
    id: 'gyg',
    category: 'Tours & Experiences',
    emoji: '🎭',
    name: 'GetYourGuide',
    desc: 'Top-rated tours and activities led by local experts.',
    cta: 'Discover Activities',
    color: '#FF8210',
    href: 'https://www.getyourguide.com',
  },
  {
    id: 'airbnb',
    category: 'Unique Stays',
    emoji: '🏠',
    name: 'Airbnb',
    desc: 'Find homes, apartments and authentic local experiences.',
    cta: 'Browse Unique Stays',
    color: '#993556',
    href: 'https://www.airbnb.com',
  },
  {
    id: 'viator',
    category: 'Guided Experiences',
    emoji: '🌟',
    name: 'Viator',
    desc: 'Premium tours, skip-the-line tickets, private guides.',
    cta: 'Browse Experiences',
    color: '#0F6E56',
    href: 'https://www.viator.com',
  },
  {
    id: 'rentalcars',
    category: 'Car Rental',
    emoji: '🚗',
    name: 'Rentalcars.com',
    desc: 'Compare all major providers. Best price guarantee.',
    cta: 'Compare Car Rentals',
    color: '#185FA5',
    href: 'https://www.rentalcars.com',
  },
];

export default function ReadyToBook({ destination }: ReadyToBookProps) {
  const topRow = PARTNERS.slice(0, 3);
  const bottomRow = PARTNERS.slice(3);

  return (
    <div className="mt-8 rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-[#00447B] px-6 py-5 flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Smartphone size={20} color="white" />
        </div>
        <div>
          <p className="font-['Poppins'] font-bold text-white text-base leading-tight">
            Ready to Book?
          </p>
          <p className="font-['Inter'] text-white/65 text-sm mt-0.5">
            Handpicked partners for{' '}
            <span className="text-white font-semibold">{destination}</span>
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="bg-[#F8FAFC] p-5 flex flex-col gap-3">
        {/* Top row: 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topRow.map(p => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>
        {/* Bottom row: 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bottomRow.map(p => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="font-['Inter'] text-[11px] text-gray-400 text-center px-5 py-3 bg-[#F8FAFC] border-t border-gray-100">
        We may earn a small commission when you book through these links, at no extra cost to you.
      </p>
    </div>
  );
}

function PartnerCard({ partner }: { partner: typeof PARTNERS[number] }) {
  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group bg-white rounded-xl border border-[rgba(0,68,123,0.1)] p-4 flex flex-col gap-2 no-underline transition-all duration-150 hover:shadow-md hover:border-[rgba(0,68,123,0.25)]"
    >
      {/* Icon + labels */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${partner.color}18` }}
        >
          {partner.emoji}
        </div>
        <div className="min-w-0">
          <p
            className="font-['Poppins'] font-bold text-[10px] uppercase tracking-wide leading-none mb-0.5"
            style={{ color: partner.color }}
          >
            {partner.category}
          </p>
          <p className="font-['Poppins'] font-bold text-[13px] text-gray-900 leading-tight">
            {partner.name}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="font-['Inter'] text-[12px] text-gray-500 leading-relaxed flex-1">
        {partner.desc}
      </p>

      {/* CTA */}
      <p
        className="font-['Poppins'] font-semibold text-[12px]"
        style={{ color: partner.color }}
      >
        {partner.cta} →
      </p>
    </a>
  );
}
