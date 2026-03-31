import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 });
    }

    console.log('[Brevo] Adding contact:', email, 'to list 17');

    // Upsert contact into Brevo and add to list 17
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName || '',
          LASTNAME: lastName || '',
          SOURCE: source || 'luna_signup',
          SIGNUP_DATE: new Date().toISOString().split('T')[0],
        },
        listIds: [17],
        updateEnabled: true,
      }),
    });

    // 204 = already exists and updated, 201 = created
    if (response.status === 201 || response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const errorData = await response.json().catch(() => ({}));
    console.error('[Brevo] Failed to add contact:', errorData);
    return NextResponse.json({ error: 'Brevo error', details: errorData }, { status: 500 });

  } catch (err) {
    console.error('[Brevo] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
