import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://www.lunaletsgo.com';

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string; locale: string }> }
): Promise<Metadata> {
  const { tripId, locale } = await params;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: trip } = await serviceSupabase
    .from('saved_trips')
    .select('destination')
    .eq('id', tripId)
    .single();

  const destination = trip?.destination ?? 'Trip';
  const ogImageUrl = `${BASE_URL}/api/og/trip/${tripId}`;
  const pageUrl = `${BASE_URL}/${locale}/trip/${tripId}`;

  return {
    title: `${destination} — Luna Let's Go`,
    description: `Join the collaborative trip to ${destination}, planned with Luna Let's Go.`,
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${destination} — Luna Let's Go`,
      description: `Join the collaborative trip to ${destination}, planned with Luna Let's Go.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${destination} trip itinerary`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${destination} — Luna Let's Go`,
      description: `Join the collaborative trip to ${destination}, planned with Luna Let's Go.`,
      images: [ogImageUrl],
    },
  };
}

export default function TripLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
