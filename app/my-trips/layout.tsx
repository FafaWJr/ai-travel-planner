import type { Metadata } from 'next';

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'My Trips — Your Saved Itineraries',
  description:
    "View and manage all your personalised travel itineraries saved on Luna Let's Go. Access your trip plans, review your AI-generated itineraries, and pick up where you left off.",
  alternates: { canonical: `${BASE_URL}/my-trips` },
  robots: { index: false, follow: false },
  openGraph: {
    title: "My Trips | Luna Let's Go",
    description: 'View and manage your saved personalised travel itineraries.',
    url: `${BASE_URL}/my-trips`,
    type: 'website',
  },
};

export default function MyTripsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
