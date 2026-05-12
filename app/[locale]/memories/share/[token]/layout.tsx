import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://www.lunaletsgo.com';

export async function generateMetadata(
  { params }: { params: Promise<{ token: string; locale: string }> },
): Promise<Metadata> {
  const { token, locale } = await params;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: memory } = await serviceSupabase
    .from('trip_memories')
    .select('memory_data')
    .eq('share_token', token)
    .eq('status', 'complete')
    .single();

  const memData = memory?.memory_data as {
    tripDestination?: string;
    tripTitle?: string;
  } | null;

  const destination =
    memData?.tripDestination || memData?.tripTitle || 'A trip';

  const ogImageUrl = `${BASE_URL}/api/og/memory/${token}`;
  const pageUrl = `${BASE_URL}/${locale}/memories/share/${token}`;

  return {
    title: `${destination} — Trip Memory | Luna Let's Go`,
    description: `Read the story of a trip to ${destination}, written with Luna Let's Go.`,
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${destination} — Trip Memory | Luna Let's Go`,
      description: `Read the story of a trip to ${destination}, written with Luna Let's Go.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Trip memory: ${destination}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${destination} — Trip Memory | Luna Let's Go`,
      description: `Read the story of a trip to ${destination}, written with Luna Let's Go.`,
      images: [ogImageUrl],
    },
  };
}

export default function MemoryShareLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
