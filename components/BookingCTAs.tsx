'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { TripFormData } from '@/types';
import { BOOKING_AFFILIATE } from '@/lib/affiliate';

interface BookingCTAsProps {
  destination: string;
  formData: TripFormData;
}

interface PartnerLink {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  color: string;          // Tailwind bg class for the icon bg
  textColor: string;      // Tailwind text class for the icon
  ctaLabel: string;
  buildUrl: (destination: string, formData: TripFormData) => string;
  affiliateNote: string;  // placeholder comment for where to add affiliate ID
  showFor: ('budget' | 'mid-range' | 'premium')[];
}

const PARTNERS: PartnerLink[] = [
  {
    id: 'booking',
    name: 'Booking.com',
    emoji: '🏨',
    tagline: 'Hotels & Apartments',
    description: 'Compare 1M+ properties worldwide. Free cancellation on most bookings.',
    color: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    ctaLabel: 'Find Accommodation',
    buildUrl: (_dest, _form) => {
      return BOOKING_AFFILIATE.hotels;
    },
    affiliateNote: 'booking.com/affiliate-program',
    showFor: ['budget', 'mid-range', 'premium'],
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    emoji: '🎭',
    tagline: 'Tours & Experiences',
    description: 'Book top-rated tours, day trips, and activities led by local experts.',
    color: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    ctaLabel: 'Discover Activities',
    buildUrl: (dest) => {
      // TODO: Add your GetYourGuide partner ID: ?partner_id=YOUR_ID
      return `https://www.getyourguide.com/s/?q=${encodeURIComponent(dest)}&locale_autoredirect=1`;
    },
    affiliateNote: 'partner.getyourguide.com',
    showFor: ['budget', 'mid-range', 'premium'],
  },
  {
    id: 'viator',
    name: 'Viator',
    emoji: '🌟',
    tagline: 'Guided Experiences',
    description: 'Premium tours, skip-the-line tickets, private guides and exclusive experiences.',
    color: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    ctaLabel: 'Browse Experiences',
    buildUrl: (dest) => {
      // TODO: Add your Viator affiliate ID via the Tripadvisor affiliate program
      return `https://www.viator.com/searchResults/all?text=${encodeURIComponent(dest)}`;
    },
    affiliateNote: 'partnerresources.viator.com',
    showFor: ['mid-range', 'premium'],
  },
  {
    id: 'rentalcars',
    name: 'Rentalcars.com',
    emoji: '🚗',
    tagline: 'Car Rental',
    description: 'Compare car hire from all major providers. No hidden fees, best price guarantee.',
    color: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    ctaLabel: 'Compare Car Rentals',
    buildUrl: (dest) => {
      const params = new URLSearchParams({
        country: dest,
        // TODO: Add your Rentalcars.com affiliate ID: &affiliateCode=YOUR_CODE
      });
      return `https://www.rentalcars.com/en/searchresults?${params}`;
    },
    affiliateNote: 'rentalcars.com/affiliate',
    showFor: ['mid-range', 'premium'],
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    emoji: '🏠',
    tagline: 'Homes & Unique Stays',
    description: 'Find unique homes, apartments and local experiences for a more authentic stay.',
    color: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    ctaLabel: 'Browse Unique Stays',
    buildUrl: (dest) => {
      // TODO: Add Airbnb affiliate via Impact Radius: https://impact.com/affiliate/airbnb
      return `https://www.airbnb.com/s/${encodeURIComponent(dest)}/homes`;
    },
    affiliateNote: 'impact.com — search Airbnb affiliate',
    showFor: ['mid-range', 'premium'],
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    emoji: '🎒',
    tagline: 'Budget & Social Stays',
    description: 'Best hostels and budget stays worldwide. Meet fellow travellers and save more.',
    color: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    ctaLabel: 'Find Budget Stays',
    buildUrl: (dest) => {
      // TODO: Add Hostelworld affiliate ID via their partner program
      return `https://www.hostelworld.com/findabed.php/ChosenCity.${encodeURIComponent(dest)}`;
    },
    affiliateNote: 'hostelworldgroup.com/affiliates',
    showFor: ['budget'],
  },
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function BookingCTAs({ destination, formData }: BookingCTAsProps) {
  const visiblePartners = PARTNERS.filter(p => p.showFor.includes(formData.budgetLevel));

  return (
    <section aria-labelledby="booking-ctas-heading" className="rounded-2xl overflow-hidden border border-sky-200 dark:border-sky-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">✈️</span>
          <h2 id="booking-ctas-heading" className="text-xl font-bold">Ready to Book?</h2>
        </div>
        <p className="text-sky-100 text-sm">
          Find the best deals for your trip to <strong className="text-white">{destination}</strong> — handpicked partners for your {formData.budgetLevel === 'budget' ? 'budget-friendly' : formData.budgetLevel === 'mid-range' ? 'mid-range' : 'premium'} trip.
        </p>
      </div>

      {/* Partner cards */}
      <div className="bg-gradient-to-b from-sky-50/60 to-white dark:from-sky-950/20 dark:to-background p-5">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {visiblePartners.map((partner) => {
            const url = partner.buildUrl(destination, formData);
            return (
              <motion.a
                key={partner.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                variants={cardVariants}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(14,165,233,0.12)' }}
                className="group flex flex-col gap-3 p-4 bg-card border border-border rounded-xl hover:border-sky-300 dark:hover:border-sky-700 transition-colors cursor-pointer no-underline"
                aria-label={`${partner.ctaLabel} on ${partner.name}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${partner.color}`} aria-hidden="true">
                    {partner.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${partner.textColor}`}>{partner.tagline}</span>
                    </div>
                    <p className="font-bold text-sm text-foreground leading-tight">{partner.name}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {partner.description}
                </p>

                <div className={`flex items-center justify-between pt-1 border-t border-border`}>
                  <span className={`text-sm font-semibold ${partner.textColor} group-hover:underline`}>
                    {partner.ctaLabel} →
                  </span>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </motion.a>
            );
          })}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          This site may receive a commission when you book through these links — at no extra cost to you. 🙏
        </p>
      </div>
    </section>
  );
}
