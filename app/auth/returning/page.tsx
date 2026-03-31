'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { syncUserToBrevo } from '@/lib/brevo';

export default function ReturningPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleRedirect = async () => {
      // Wait briefly for Supabase to process any hash fragment tokens
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();

      // Sync new Google OAuth users to Brevo
      if (session?.user) {
        const createdAt = new Date(session.user.created_at).getTime();
        const isNewUser = Date.now() - createdAt < 60_000;
        if (isNewUser) {
          const meta = session.user.user_metadata;
          syncUserToBrevo({
            email: session.user.email ?? '',
            firstName: meta?.given_name ?? meta?.full_name?.split(' ')[0] ?? '',
            lastName: meta?.family_name ?? meta?.full_name?.split(' ').slice(1).join(' ') ?? '',
            source: 'google_oauth',
          });
        }
      }

      // Read the intended destination from localStorage (try all known keys)
      const destination =
        localStorage.getItem('luna_redirect_after_login') ||
        localStorage.getItem('post_auth_redirect') ||
        localStorage.getItem('redirectAfterLogin') ||
        '/';

      // Clean up all possible keys
      localStorage.removeItem('luna_redirect_after_login');
      localStorage.removeItem('post_auth_redirect');
      localStorage.removeItem('redirectAfterLogin');

      if (session) {
        router.replace(destination);
      } else {
        // Session not yet available — listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (newSession) {
              subscription.unsubscribe();
              router.replace(destination);
            }
          }
        );

        // Fallback: if no session after 5 seconds, go to login
        setTimeout(() => {
          subscription.unsubscribe();
          router.replace('/auth/login');
        }, 5000);
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F7FB',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid rgba(0,68,123,0.12)',
        borderTop: '3px solid #FF8210',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
