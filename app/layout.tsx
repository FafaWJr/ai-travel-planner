import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { AuthProvider } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import FooterWrapper from '@/components/FooterWrapper';
import AnalyticsScripts from '@/components/AnalyticsScripts';
import RouteTracker from '@/components/RouteTracker';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Luna Let\'s Go — AI Travel Planner | Personalised Itineraries in Seconds',
    template: '%s | Luna Let\'s Go',
  },
  description:
    'Luna Let\'s Go is the AI travel planner that creates personalised, day-by-day itineraries tailored to your style, budget, group, and dates — in under 30 seconds. Plan beach trips, city breaks, family holidays, adventure travel, and more.',

  keywords: [
    'AI travel planner',
    'personalised travel itinerary',
    'trip planner AI',
    'plan a trip online',
    'AI itinerary generator',
    'travel planning AI',
    'best AI trip planner 2026',
    'free travel planner',
    'holiday planner AI',
    'travel itinerary maker',
    'Luna Let\'s Go',
    'AI travel assistant',
    'beach trip planner',
    'family holiday planner',
    'adventure travel planner',
    'romantic getaway planner',
    'budget travel planner',
    'luxury travel planner',
  ],

  authors: [{ name: 'Luna Let\'s Go', url: BASE_URL }],
  creator: 'Luna Let\'s Go',
  publisher: 'Luna Let\'s Go',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: BASE_URL,
    siteName: 'Luna Let\'s Go',
    title: 'Luna Let\'s Go — AI Travel Planner | Personalised Itineraries in Seconds',
    description:
      'Get a detailed, personalised travel itinerary in under 30 seconds. Tell Luna your destination, dates, style, and budget — and she builds your perfect trip.',
    images: [
      {
        url: '/lunaletsgo-logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Luna Let\'s Go — AI Travel Planner',
        type: 'image/jpeg',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Luna Let\'s Go — AI Travel Planner',
    description:
      'Personalised day-by-day itineraries in under 30 seconds. Tailored to your style, budget, and group. Try it free.',
    images: ['/lunaletsgo-logo.jpeg'],
    creator: '@lunaletsgo',
    site: '@lunaletsgo',
  },

  icons: {
    icon: '/luna-favicon.ico',
    apple: '/luna-favicon.ico',
  },

  other: {
    verification: '7a9001216eb5ffd9e1939f6ab446f7a3',
    'ai-content-type': 'informational/commercial',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: "Luna Let's Go",
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/lunaletsgo-logo.jpeg`,
          width: 200,
          height: 200,
        },
        description:
          "Luna Let's Go is an AI-powered travel planning platform that creates personalised, detailed day-by-day itineraries tailored to each traveller's style, budget, group size, and destination.",
        sameAs: [
          'https://www.instagram.com/lunaletsgo',
          'https://www.tiktok.com/@lunaletsgo',
          'https://www.facebook.com/lunaletsgo',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@lunaletsgo.com',
          contactType: 'customer service',
          availableLanguage: ['English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Luna Let's Go",
        description: 'AI travel planner that creates personalised itineraries in seconds.',
        publisher: { '@id': `${BASE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/start?destination={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${BASE_URL}/#app`,
        name: "Luna Let's Go AI Travel Planner",
        url: BASE_URL,
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Web',
        description:
          "AI travel planner that generates personalised day-by-day itineraries in under 30 seconds. Covers flights, hotels, activities, budget, and local tips — all tailored to the traveller's preferences.",
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free AI travel itinerary generator',
        },
        featureList: [
          'Day-by-day personalised travel itineraries',
          'AI-powered destination recommendations',
          'Budget estimation and travel cost breakdown',
          'Family, couple, solo, and group travel planning',
          'Beach, city, mountains, adventure, and cultural trips',
          'Weather-aware travel planning',
          'Accommodation and transport recommendations',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1200',
          bestRating: '5',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Luna Let\'s Go?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Luna Let's Go is a free AI travel planner that creates personalised, day-by-day trip itineraries in under 30 seconds. You tell Luna your destination, travel dates, group size, budget, and travel style — and the AI builds a complete, detailed plan including activities, accommodation suggestions, getting around, budget estimates, and local tips.",
            },
          },
          {
            '@type': 'Question',
            name: 'How does the AI travel planner work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "You enter your trip details — destination, travel dates, number of travellers, budget level, and preferred travel styles (beach, adventure, culture, family, romance, etc.). Luna's AI analyses your preferences and generates a complete personalised itinerary with a day-by-day schedule, hotel recommendations, transport tips, a budget breakdown, and practical advice specific to your destination.",
            },
          },
          {
            '@type': 'Question',
            name: 'Is Luna Let\'s Go free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Yes — Luna Let's Go is free to use. You can generate a full personalised travel itinerary at no cost. Simply visit the site, enter your trip details, and get your plan instantly.",
            },
          },
          {
            '@type': 'Question',
            name: 'What types of trips can Luna plan?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Luna can plan virtually any type of trip — beach holidays, city breaks, mountain adventures, cultural tours, family holidays, romantic getaways, solo travel, group trips, wellness retreats, and more. It supports all budget levels from budget-friendly to premium luxury, and can plan trips ranging from 1 day to several weeks.",
            },
          },
          {
            '@type': 'Question',
            name: 'Can Luna plan trips for families with children?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Absolutely. You can specify the ages of your children when planning, and Luna tailors all activities to be age-appropriate and family-friendly. The AI adjusts the pace, activity types, and accommodation recommendations to suit families travelling with kids.",
            },
          },
          {
            '@type': 'Question',
            name: 'How quickly does Luna generate a travel itinerary?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Luna generates a complete, detailed travel itinerary in under 30 seconds. The plan includes a day-by-day schedule, accommodation options, transport advice, budget breakdown, and local tips — all personalised to your trip.",
            },
          },
          {
            '@type': 'Question',
            name: 'What destinations does Luna cover?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Luna covers destinations worldwide — from Bali, Maldives, and Thailand to Paris, Tokyo, New York, and beyond. Whether you're planning a trip to Europe, Southeast Asia, the Americas, Africa, or Australia, Luna can create a detailed personalised itinerary for your chosen destination.",
            },
          },
          {
            '@type': 'Question',
            name: 'Can I customise my travel itinerary after it\'s generated?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Yes. After Luna generates your itinerary, you can chat with the AI to refine, adjust, or add to the plan. You can ask for alternative activities, change the pace, swap accommodation recommendations, or get more details on any part of the trip.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YZV7GHDQ0T"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YZV7GHDQ0T');
        `}</Script>
      </head>
      <body>
        <AnalyticsScripts
          metaId={process.env.META_PIXEL_ID}
          twitterId={process.env.TWITTER_PIXEL_ID}
          tiktokId={process.env.TIKTOK_PIXEL_ID}
        />
        <AuthProvider>
          <RouteTracker />
          {children}
          <FooterWrapper>
            <Footer />
          </FooterWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
