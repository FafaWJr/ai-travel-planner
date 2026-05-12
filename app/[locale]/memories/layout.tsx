import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

const BASE_URL = 'https://www.lunaletsgo.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'memoriesLanding' });

  const title = t('ogTitle');
  const description = t('ogDescription');
  // With localePrefix: 'as-needed', the default locale (en) has no prefix.
  // Canonical must match the actual URL the page is served at, not /en/memories.
  const canonical =
    locale === 'en' ? `${BASE_URL}/memories` : `${BASE_URL}/${locale}/memories`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${BASE_URL}/memories`,
        'pt-BR': `${BASE_URL}/pt-BR/memories`,
        es: `${BASE_URL}/es/memories`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Luna Let's Go",
      type: 'website',
      locale: locale === 'pt-BR' ? 'pt_BR' : locale === 'es' ? 'es_ES' : 'en_GB',
      images: [
        {
          url: `${BASE_URL}/images/memories-hero.jpg`,
          width: 1600,
          height: 1064,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/images/memories-hero.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function MemoriesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
