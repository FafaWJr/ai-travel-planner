import type { Metadata } from 'next';
import { PlanPageClient } from '@/components/PlanPageClient';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const destination = params.destination || 'Your Destination';

  return {
    title: `Travel Plan for ${destination} — AI Travel Planner`,
    description: `Your personalised AI-generated travel itinerary for ${destination}. Includes day-by-day activities, accommodation picks, budget estimates, and practical tips.`,
    openGraph: {
      title: `AI Travel Plan: ${destination}`,
      description: `Personalised travel itinerary for ${destination} with activities, stays, budget, and tips.`,
      type: 'website',
    },
  };
}

export default function PlanPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'AI Travel Plan',
            description: 'Personalised AI-generated travel itinerary',
            publisher: {
              '@type': 'Organization',
              name: 'AI Travel Planner',
            },
          }),
        }}
      />
      <PlanPageClient />
    </>
  );
}
