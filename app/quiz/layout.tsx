import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'What Type of Traveller Are You? Take the Quiz',
  description:
    'Answer 5 quick questions and discover your traveller persona — Beach Lover, Culture Seeker, Adventure Junkie, or more. Get personalised destination recommendations and an AI-generated trip plan matched to your style.',
  keywords: [
    'traveller personality quiz',
    'what type of traveller am I',
    'travel personality test',
    'traveller persona quiz',
    'travel style quiz',
    'best destinations for my travel style',
    'solo traveller quiz',
    'adventure traveller test',
    'beach or mountains quiz',
    'travel quiz 2026',
  ],
  alternates: { canonical: `${BASE_URL}/quiz` },
  openGraph: {
    title: 'What Type of Traveller Are You? Take the Quiz | Luna Let\'s Go',
    description:
      'Discover your traveller persona in 5 quick questions. Unlock personalised destination picks and an AI itinerary built around your unique travel style.',
    url: `${BASE_URL}/quiz`,
    type: 'website',
    images: [{ url: `${BASE_URL}/lunaletsgo-logo.jpeg`, width: 1200, height: 630, alt: 'Traveller Quiz — Luna Let\'s Go' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Type of Traveller Are You? | Luna Let\'s Go',
    description: 'Discover your travel persona and get AI-personalised destination picks in seconds.',
    images: [`${BASE_URL}/lunaletsgo-logo.jpeg`],
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: "What Type of Traveller Are You? — Luna Let's Go",
    description:
      'A 5-question interactive quiz to determine your traveller persona and recommend personalised destinations.',
    url: `${BASE_URL}/quiz`,
    educationalUse: 'Self-assessment',
    audience: { '@type': 'Audience', audienceType: 'Travellers' },
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
