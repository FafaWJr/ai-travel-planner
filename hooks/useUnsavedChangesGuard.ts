'use client';

import { useEffect, useRef } from 'react';

export type NavigationType = 'link' | 'popstate';

interface UseUnsavedChangesGuardOptions {
  hasUnsavedChanges: boolean;
  onNavigationAttempt: (destination: string, type: NavigationType) => void;
}

export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  onNavigationAttempt,
}: UseUnsavedChangesGuardOptions): { releaseGuard: () => void } {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const onNavigationAttemptRef = useRef(onNavigationAttempt);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    onNavigationAttemptRef.current = onNavigationAttempt;
  }, [onNavigationAttempt]);

  // 1. Browser-level exits: tab close, hard refresh, address bar navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 2. Soft back/forward button (browser history navigation)
  useEffect(() => {
    const handlePopState = () => {
      if (!hasUnsavedChangesRef.current) return;
      // Push current URL back to cancel the navigation
      window.history.pushState(null, '', window.location.href);
      onNavigationAttemptRef.current('__popstate__', 'popstate');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. Link clicks — intercept in capture phase BEFORE Next.js router sees them.
  //    Works regardless of whether Next.js uses pushState, window.navigation, etc.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChangesRef.current) return;

      // Walk up DOM tree to find the anchor element
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore: external links, mailto, tel, javascript, anchor-only
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href === ''
      ) return;

      // Ignore: same page (e.g. /#section scrolls)
      try {
        const dest = new URL(href, window.location.href);
        if (dest.pathname === window.location.pathname) return;
      } catch {
        return;
      }

      // Block the click and show the modal
      e.preventDefault();
      e.stopPropagation();
      onNavigationAttemptRef.current(href, 'link');
    };

    // capture: true = runs before React/Next.js event handlers
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Synchronously clears the guard ref so beforeunload does not fire
  // during intentional programmatic navigation (after user confirms in modal).
  // Must be called immediately before window.location.href assignment.
  const releaseGuard = () => {
    hasUnsavedChangesRef.current = false;
  };

  return { releaseGuard };
}
