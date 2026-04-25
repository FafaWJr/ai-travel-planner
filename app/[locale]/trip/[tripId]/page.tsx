'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { COLLAB_ENABLED } from '@/lib/collaboration';

type PageState =
  | { kind: 'loading' }
  | { kind: 'joining' }
  | { kind: 'joined'; role: 'viewer' | 'editor' }
  | { kind: 'already-owner' }
  | { kind: 'already-collaborator' }
  | { kind: 'error'; message: string };

export default function TripSharePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('collab.share');

  const tripId = params.tripId as string;
  const token = searchParams.get('invite');
  const locale = params.locale as string;

  const [state, setState] = useState<PageState>({ kind: 'loading' });

  useEffect(() => {
    if (!COLLAB_ENABLED) {
      setState({ kind: 'error', message: t('featureDisabled') });
      return;
    }
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
      setState({ kind: 'error', message: t('invalidLink') });
      return;
    }

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const returnPath = `/${locale}/trip/${tripId}?invite=${token}`;
        // Belt-and-braces: write to localStorage (read by /auth/returning
        // after the OAuth round-trip) AND pass as ?next= query param (used
        // by /auth/login email/password flow + Google OAuth's pre-redirect
        // localStorage write). The login page would otherwise overwrite
        // luna_redirect_after_login with its own next='/' default.
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('luna_redirect_after_login', returnPath);
        }
        router.push(`/auth/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }

      setState({ kind: 'joining' });
      const res = await fetch(`/api/trips/${tripId}/join?token=${token}`, {
        method: 'POST',
      });
      const body = await res.json().catch(() => ({}));

      if (body.alreadyOwner) {
        setState({ kind: 'already-owner' });
        setTimeout(() => router.push(`/${locale}/plan?tripId=${tripId}`), 800);
        return;
      }
      if (body.alreadyCollaborator) {
        setState({ kind: 'already-collaborator' });
        setTimeout(() => router.push(`/${locale}/plan?tripId=${tripId}`), 800);
        return;
      }
      if (!res.ok) {
        setState({ kind: 'error', message: body.error || t('joinFailed') });
        return;
      }

      setState({ kind: 'joined', role: body.role });
      setTimeout(() => router.push(`/${locale}/plan?tripId=${tripId}`), 1200);
    })();
  }, [tripId, token, locale, router, t]);

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '32px 24px', fontFamily: 'Inter, Lato, sans-serif', color: '#00447B' }}>
      {state.kind === 'loading' && <p>{t('loading')}</p>}
      {state.kind === 'joining' && <p>{t('joining')}</p>}
      {state.kind === 'joined' && (
        <>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', color: '#FF8210' }}>
            {t('joinedTitle')}
          </h1>
          <p>{state.role === 'editor' ? t('joinedAsEditor') : t('joinedAsViewer')}</p>
        </>
      )}
      {state.kind === 'already-owner' && <p>{t('alreadyOwner')}</p>}
      {state.kind === 'already-collaborator' && <p>{t('alreadyCollaborator')}</p>}
      {state.kind === 'error' && (
        <>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', color: '#FF8210' }}>
            {t('errorTitle')}
          </h1>
          <p>{state.message}</p>
        </>
      )}
    </div>
  );
}
