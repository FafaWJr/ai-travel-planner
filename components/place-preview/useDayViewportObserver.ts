'use client';

// components/place-preview/useDayViewportObserver.ts
// IntersectionObserver hook that triggers batch place resolution
// when a day card section scrolls into the viewport.

import { useEffect, useRef, useCallback } from 'react';

interface DayObserverOptions {
  onDayVisible: (dayElement: HTMLElement) => void;
  enabled: boolean;
}

export function useDayViewportObserver({ onDayVisible, enabled }: DayObserverOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElements = useRef<Set<HTMLElement>>(new Set());
  const triggeredDays = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const dayId = el.dataset.dayId;
          if (!dayId || triggeredDays.current.has(dayId)) continue;
          triggeredDays.current.add(dayId);
          onDayVisible(el);
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0,
      }
    );

    for (const el of observedElements.current) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [enabled, onDayVisible]);

  const attachRef = useCallback((el: HTMLElement | null) => {
    if (!el || !enabled) return;
    if (observedElements.current.has(el)) return;
    observedElements.current.add(el);
    observerRef.current?.observe(el);
  }, [enabled]);

  return { attachRef };
}
