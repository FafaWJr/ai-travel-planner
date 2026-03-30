import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'Travel Destination Ideas & Inspiration — 45+ Trips',
  description:
    'Explore 45+ hand-picked travel destinations for every type of traveller — beaches, mountains, city breaks, cultural tours, adventure, family, romance, and more. Find your next trip and plan it in seconds with AI.',
  keywords: [
    'travel destination ideas',
    'best travel destinations 2026',
    'where to go on holiday',
    'trip ideas',
    'holiday inspiration',
    'travel inspiration',
    'beach holiday ideas',
    'city break ideas',
    'adventure travel destinations',
    'family holiday destinations',
    'romantic getaway ideas',
    'budget travel destinations',
  ],
  alternates: { canonical: `${BASE_URL}/trip-ideas` },
  openGraph: {
    title: 'Travel Destination Ideas & Inspiration — 45+ Trips | Luna Let\'s Go',
    description:
      'Browse 45+ curated destinations across beach, mountains, cities, culture, adventure, family, romance and more. Tap any destination to generate your personalised AI itinerary.',
    url: `${BASE_URL}/trip-ideas`,
    type: 'website',
    images: [{ url: `${BASE_URL}/lunaletsgo-logo.jpeg`, width: 1200, height: 630, alt: 'Trip Ideas — Luna Let\'s Go' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Destination Ideas | Luna Let\'s Go',
    description: 'Browse 45+ hand-picked destinations and plan your trip with AI in seconds.',
    images: [`${BASE_URL}/lunaletsgo-logo.jpeg`],
  },
};

export default function TripIdeasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
