import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Instantiate inside handler so env vars are available at runtime, not build time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any });

  // Service role client: bypasses RLS (no user session in webhook context)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('[webhook] signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const memoryId = session.metadata?.memoryId;
    const userId = session.metadata?.userId;

    if (!memoryId || !userId) {
      console.error('[webhook] missing metadata:', session.metadata);
      return Response.json({ error: 'Missing metadata' }, { status: 400 });
    }

    try {
      // Idempotent: check if already marked
      const { data: existing } = await serviceSupabase
        .from('trip_memories')
        .select('pdf_purchased')
        .eq('id', memoryId)
        .single();

      if (existing?.pdf_purchased) {
        console.log(`[webhook] memory ${memoryId} already purchased, skipping`);
        return Response.json({ received: true });
      }

      const { error } = await serviceSupabase
        .from('trip_memories')
        .update({ pdf_purchased: true })
        .eq('id', memoryId);

      if (error) {
        console.error('[webhook] update error:', error);
        return Response.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`[webhook] memory ${memoryId} marked as pdf_purchased`);
    } catch (err) {
      console.error('[webhook] database error:', err);
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
