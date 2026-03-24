import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Travel Planner — Plan Your Perfect Trip',
  description: 'Tell us your dream destination and get a personalised, detailed travel plan in seconds — tailored to your style, budget, and group.',
  openGraph: {
    title: 'AI Travel Planner',
    description: 'Plan your perfect trip with AI in seconds.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="verification" content="7a9001216eb5ffd9e1939f6ab446f7a3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
