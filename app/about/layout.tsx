import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'About Luna Let\'s Go — AI Travel Planning Built for Real Travellers',
  description:
    "Luna Let's Go was built by travellers, for travellers. Learn the story behind the AI travel planner that creates personalised itineraries in seconds — and why it feels more human than any travel site you've used before.",
  keywords: [
    "about Luna Let's Go",
    'AI travel planner story',
    'travel planning company',
    'who built Luna travel AI',
    'AI travel assistant team',
    'personalised travel planning app',
    'travel tech startup',
  ],
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: "About Luna Let's Go | AI Travel Planner Built for Real Travellers",
    description:
      "Built by travellers who were tired of generic itineraries. Luna creates personalised travel plans that actually match how you travel.",
    url: `${BASE_URL}/about`,
    type: 'website',
    images: [{ url: `${BASE_URL}/lunaletsgo-logo.jpeg`, width: 1200, height: 630, alt: "About Luna Let's Go" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "About Luna Let's Go",
    description: "The AI travel planner built by real travellers — for real travellers.",
    images: [`${BASE_URL}/lunaletsgo-logo.jpeg`],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: "About Luna Let's Go",
    url: `${BASE_URL}/about`,
    description:
      "Luna Let's Go is an AI travel planning platform built by passionate travellers to help people plan personalised, meaningful trips — faster than any traditional travel site.",
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
