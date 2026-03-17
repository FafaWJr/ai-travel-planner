import type { Metadata } from 'next';
import { Syne, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700', '800'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'AI Travel Planner',
    template: '%s | AI Travel Planner',
  },
  description: 'Plan your perfect trip with AI. Get a personalised, detailed travel plan in seconds.',
  keywords: ['travel', 'AI', 'trip planner', 'itinerary', 'vacation planning'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'AI Travel Planner',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${plusJakartaSans.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {/* pt-16 compensates for the fixed navbar (h-16) */}
          <div className="flex-1 pt-16">{children}</div>
          <footer className="border-t border-border/60 bg-muted/20 py-8 px-4" role="contentinfo">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  AI Travel Planner
                </span>
              </div>
              <p className="text-xs">
                &copy; {new Date().getFullYear()} AI Travel Planner. Built with Next.js &amp; OpenRouter.
              </p>
              <p className="text-xs">
                Weather data from{' '}
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  Open-Meteo
                </a>
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
