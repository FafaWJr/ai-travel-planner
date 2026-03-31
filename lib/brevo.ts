export async function syncUserToBrevo({
  email,
  firstName,
  lastName,
  source,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}) {
  try {
    await fetch('/api/brevo-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, source }),
    });
  } catch (err) {
    // Non-blocking — never throw
    console.error('[Brevo] sync failed:', err);
  }
}
