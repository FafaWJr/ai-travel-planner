import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code       = requestUrl.searchParams.get('code');
  const tokenHash  = requestUrl.searchParams.get('token_hash');
  const type       = requestUrl.searchParams.get('type') as 'email' | 'recovery' | 'invite' | null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );

  if (code) {
    // OAuth or PKCE code flow
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL('/auth/returning', requestUrl.origin));
  }

  if (tokenHash && type) {
    // Email confirmation / magic link / password reset
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL('/auth/returning', requestUrl.origin));
    }
    // Verification failed: send to login with error hint
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', requestUrl.origin));
  }

  // No recognised params: fall through to returning (handles hash fragments)
  return NextResponse.redirect(new URL('/auth/returning', requestUrl.origin));
}
