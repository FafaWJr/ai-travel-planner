import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'Plan Your Dream Trip with AI — Free Itinerary Generator',
  description:
    'Enter your destination, travel dates, group size, and budget — and get a complete personalised day-by-day itinerary in under 30 seconds. Free AI travel planner, no sign-up required.',
  keywords: [
    'plan a trip online free',
    'AI itinerary generator',
    'free trip planner',
    'travel itinerary maker',
    'create travel itinerary AI',
    'personalised holiday planner',
    'day by day itinerary generator',
    'trip planning tool',
    'travel plan generator',
    'how to plan a trip',
  ],
  alternates: { canonical: `${BASE_URL}/start` },
  openGraph: {
    title: 'Plan Your Dream Trip with AI | Luna Let\'s Go',
    description:
      'Tell Luna your destination, dates, and preferences — get a complete personalised travel itinerary in under 30 seconds. Free, no sign-up needed.',
    url: `${BASE_URL}/start`,
    type: 'website',
    images: [{ url: `${BASE_URL}/lunaletsgo-logo.jpeg`, width: 1200, height: 630, alt: 'Plan a Trip — Luna Let\'s Go' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plan Your Dream Trip | Luna Let\'s Go',
    description: 'Free AI trip planner — get a personalised day-by-day itinerary in 30 seconds.',
    images: [`${BASE_URL}/lunaletsgo-logo.jpeg`],
  },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: "Luna Let's Go — AI Trip Planner",
    url: `${BASE_URL}/start`,
    description:
      'Free AI travel planning service that generates personalised, day-by-day trip itineraries tailored to your destination, dates, travel style, group size, and budget.',
    provider: {
      '@type': 'Organization',
      name: "Luna Let's Go",
      url: BASE_URL,
    },
    serviceType: 'Travel Planning',
    areaServed: 'Worldwide',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free AI travel itinerary generation',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
