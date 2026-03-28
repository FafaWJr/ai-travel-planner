import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // Build the redirect response BEFORE exchanging the code so we can
    // attach the new session cookies directly to it. In Next.js 15/16,
    // cookies set via the `cookies()` API are NOT automatically forwarded
    // to a NextResponse.redirect() — they go to a different response context.
    // New users have NO existing cookies, so they depend entirely on this
    // redirect carrying the freshly-minted session cookies.
    const redirectResponse = NextResponse.redirect(`${origin}/auth/returning`)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) => {
              // Write to BOTH the cookieStore and the redirect response.
              // The cookieStore write keeps parity for server components;
              // the redirect response write is what actually reaches the browser.
              try { cookieStore.set(name, value, options) } catch {}
              redirectResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return redirectResponse
    }
  }

  // Auth failure — send to login with an error hint
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
