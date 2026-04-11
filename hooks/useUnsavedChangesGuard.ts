'use client';

import { useEffect, useRef } from 'react';

interface UseUnsavedChangesGuardOptions {
  hasUnsavedChanges: boolean;
  onNavigationAttempt: (destination: string, type: 'push' | 'popstate') => void;
}

export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  onNavigationAttempt,
}: UseUnsavedChangesGuardOptions) {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const onNavigationAttemptRef = useRef(onNavigationAttempt);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    onNavigationAttemptRef.current = onNavigationAttempt;
  }, [onNavigationAttempt]);

  // 1. Browser-level: tab close, refresh, hard back
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 2. Client-side navigation: intercept pushState only
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    const isSamePage = (url: string | URL | null | undefined): boolean => {
      if (!url) return true;
      try {
        const dest = new URL(url.toString(), window.location.href);
        // Same path AND same search = Next.js internal update, not real navigation
        return (
          dest.pathname === window.location.pathname &&
          dest.search === window.location.search
        );
      } catch {
        return false;
      }
    };

    const interceptPush = (url: string | URL | null | undefined): boolean => {
      if (!hasUnsavedChangesRef.current) return false;
      if (!url) return false;
      const destination = url.toString();
      if (destination.startsWith('#')) return false;
      if (isSamePage(destination)) return false;
      onNavigationAttemptRef.current(destination, 'push');
      return true;
    };

    window.history.pushState = function (state, title, url) {
      if (interceptPush(url ?? undefined)) return;
      originalPushState(state, title, url);
    };

    // replaceState is used heavily by Next.js App Router internals — never block it
    window.history.replaceState = function (state, title, url) {
      originalReplaceState(state, title, url);
    };

    // 3. Soft back/forward button
    const handlePopState = () => {
      if (hasUnsavedChangesRef.current) {
        originalPushState(null, '', window.location.href);
        onNavigationAttemptRef.current('__popstate__', 'popstate');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
