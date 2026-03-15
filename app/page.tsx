import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'AI Travel Planner — Plan Your Perfect Trip with AI',
  description: 'Get a personalised, detailed travel plan in seconds. Tell us about your dream trip and our AI will craft the perfect itinerary tailored to your style and budget.',
  keywords: ['travel planner', 'AI travel', 'itinerary generator', 'trip planning', 'personalised travel'],
  openGraph: {
    title: 'AI Travel Planner — Plan Your Perfect Trip',
    description: 'Get a personalised, detailed travel plan in seconds. Tailored to your style, budget, and group.',
    type: 'website',
  },
};

export default function Home() {
  return <LandingPage />;
}
