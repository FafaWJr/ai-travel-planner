import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import FooterWrapper from '@/components/FooterWrapper';

export const metadata: Metadata = {
  title: 'AI Travel Planner — Plan Your Perfect Trip',
  description: 'Tell us your dream destination and get a personalised, detailed travel plan in seconds — tailored to your style, budget, and group.',
  openGraph: {
    title: 'AI Travel Planner',
    description: 'Plan your perfect trip with AI in seconds.',
    type: 'website',
  },
  other: {
    verification: '7a9001216eb5ffd9e1939f6ab446f7a3',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <FooterWrapper>
            <Footer />
          </FooterWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
