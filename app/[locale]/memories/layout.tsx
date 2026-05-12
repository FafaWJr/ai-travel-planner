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
  const url = `${BASE_URL}/${locale}/memories`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/memories`,
        'pt-BR': `${BASE_URL}/pt-BR/memories`,
        es: `${BASE_URL}/es/memories`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Luna Let's Go",
      type: 'website',
      locale: locale === 'pt-BR' ? 'pt_BR' : locale === 'es' ? 'es_ES' : 'en_GB',
      images: [
        {
          url: `${BASE_URL}/images/memories-hero.jpg`,
          width: 1200,
          height: 630,
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
