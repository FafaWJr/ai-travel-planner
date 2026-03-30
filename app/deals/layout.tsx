import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'Travel Deals — Flights, Hotels, Excursions & Tickets',
  description:
    'Find the best travel deals on flights, hotels, excursions, and attraction tickets. Curated offers updated regularly — save money on your next trip planned with Luna.',
  keywords: [
    'travel deals',
    'cheap flights 2026',
    'hotel deals',
    'holiday deals',
    'excursion deals',
    'travel discounts',
    'cheap holidays',
    'last minute travel deals',
    'budget travel offers',
    'attraction tickets deals',
    'travel vouchers',
  ],
  alternates: { canonical: `${BASE_URL}/deals` },
  openGraph: {
    title: "Travel Deals — Flights, Hotels & Excursions | Luna Let's Go",
    description:
      'Save on your next adventure. Browse curated travel deals on flights, hotels, excursions, and tickets — updated regularly.',
    url: `${BASE_URL}/deals`,
    type: 'website',
    images: [{ url: `${BASE_URL}/lunaletsgo-logo.jpeg`, width: 1200, height: 630, alt: "Travel Deals — Luna Let's Go" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Travel Deals | Luna Let's Go",
    description: 'Best deals on flights, hotels, excursions and tickets. Save on your next trip.',
    images: [`${BASE_URL}/lunaletsgo-logo.jpeg`],
  },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Travel Deals — Luna Let's Go",
    url: `${BASE_URL}/deals`,
    description:
      'Curated travel deals including discounted flights, hotels, excursions, and attraction tickets.',
    publisher: {
      '@type': 'Organization',
      name: "Luna Let's Go",
      url: BASE_URL,
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
