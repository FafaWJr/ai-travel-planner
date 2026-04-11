'use client';

import { useEffect, useRef } from 'react';

interface UseUnsavedChangesGuardOptions {
  hasUnsavedChanges: boolean;
  onNavigationAttempt: (destination: string) => void;
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

  // Browser-level: tab close, refresh, hard back
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

  // Client-side navigation: intercept pushState / replaceState
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    const interceptNavigation = (url: string | URL | null | undefined): boolean => {
      if (!hasUnsavedChangesRef.current) return false;
      if (!url) return false;
      const destination = url.toString();
      if (destination.startsWith('#')) return false;
      onNavigationAttemptRef.current(destination);
      return true;
    };

    window.history.pushState = function (state, title, url) {
      if (interceptNavigation(url ?? undefined)) return;
      originalPushState(state, title, url);
    };

    window.history.replaceState = function (state, title, url) {
      if (interceptNavigation(url ?? undefined)) return;
      originalReplaceState(state, title, url);
    };

    const handlePopState = () => {
      if (hasUnsavedChangesRef.current) {
        window.history.pushState(null, '', window.location.href);
        onNavigationAttemptRef.current(document.referrer || '/');
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
