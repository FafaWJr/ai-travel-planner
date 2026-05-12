import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const BASE_URL = 'https://www.lunaletsgo.com';

// This layout exists solely to override the canonical URL that would otherwise
// be inherited from the parent /memories layout.tsx. The [tripId] capture page
// is a private authenticated route and should not be indexed.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tripId: string; locale: string }>;
}): Promise<Metadata> {
  const { tripId, locale } = await params;

  const pageUrl =
    locale === 'en'
      ? `${BASE_URL}/memories/${tripId}`
      : `${BASE_URL}/${locale}/memories/${tripId}`;

  return {
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function MemoriesCaptureLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
