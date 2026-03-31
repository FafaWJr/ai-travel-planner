'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Fires a page_view event on every client-side route change.
 * Must be rendered inside the root layout (client-side only).
 * GA4, Meta Pixel, Twitter, and TikTok all receive the event.
 */
export default function RouteTracker() {
  const pathname = usePathname();
  const isFirst  = useRef(true);

  useEffect(() => {
    // Skip the very first render — each pixel already fires PageView on init
    if (isFirst.current) { isFirst.current = false; return; }
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
