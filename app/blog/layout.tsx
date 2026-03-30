import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'Travel Blog — Tips, Guides & Destination Stories',
  description:
    "Discover expert travel guides, destination tips, packing advice, and trip inspiration on the Luna Let's Go blog. From Bali to Patagonia — practical, first-hand travel content for every type of traveller.",
  keywords: [
    'travel blog',
    'travel tips',
    'destination guides',
    'travel advice',
    'where to go 2026',
    'best travel destinations',
    'travel inspiration',
    'holiday tips',
    'backpacking tips',
    'travel guides for beginners',
    'family travel tips',
    'solo travel advice',
  ],
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Travel Blog — Tips, Guides & Destination Stories | Luna Let\'s Go',
    description:
      'Expert destination guides, practical travel tips, and inspiring trip stories. Find your next adventure on the Luna Blog.',
    url: `${BASE_URL}/blog`,
    type: 'website',
    images: [{ url: `${BASE_URL}/lunaletsgo-logo.jpeg`, width: 1200, height: 630, alt: "Luna Let's Go Travel Blog" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Travel Blog | Luna Let's Go",
    description: 'Travel tips, destination guides, and trip inspiration for every type of traveller.',
    images: [`${BASE_URL}/lunaletsgo-logo.jpeg`],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: "Luna Let's Go Travel Blog",
    url: `${BASE_URL}/blog`,
    description:
      'Travel tips, destination guides, and trip inspiration from the Luna travel planning team.',
    publisher: {
      '@type': 'Organization',
      name: "Luna Let's Go",
      url: BASE_URL,
    },
    inLanguage: 'en',
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
