import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
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
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border bg-muted/30 py-6 px-4 mt-auto" role="contentinfo">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">✈️</span>
                <span className="font-medium text-foreground">AI Travel Planner</span>
              </div>
              <p>
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
