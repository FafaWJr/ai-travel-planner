import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  // Instantiate inside handler so STRIPE_SECRET_KEY is available at runtime, not build time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId } = await request.json() as { memoryId: string };
    if (!memoryId) {
      return Response.json({ error: 'memoryId is required' }, { status: 400 });
    }

    // Dual-lookup: try trip_id then id
    let memory = null;
    const { data: byTripId } = await supabase
      .from('trip_memories')
      .select('id, trip_id, pdf_purchased, memory_data')
      .eq('trip_id', memoryId)
      .eq('user_id', user.id)
      .single();

    if (byTripId) {
      memory = byTripId;
    } else {
      const { data: byId } = await supabase
        .from('trip_memories')
        .select('id, trip_id, pdf_purchased, memory_data')
        .eq('id', memoryId)
        .eq('user_id', user.id)
        .single();
      memory = byId;
    }

    if (!memory) {
      return Response.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Already purchased: skip payment
    if (memory.pdf_purchased) {
      return Response.json({ alreadyPurchased: true });
    }

    const memData = memory.memory_data as {
      tripDestination?: string;
      tripTitle?: string;
    } | null;
    const destination = memData?.tripDestination ?? memData?.tripTitle ?? 'Trip Memory';

    // Canonical return ID: trip_id for linked memories, id for standalone
    const returnId = (memory.trip_id as string | null) ?? memory.id;
    const origin = request.headers.get('origin') ?? 'https://www.lunaletsgo.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Trip Story PDF: ${destination}`,
            description: 'A premium, editorially designed PDF of your trip story, narrated by Luna.',
          },
          unit_amount: 1000,
        },
        quantity: 1,
      }],
      metadata: {
        memoryId: memory.id,
        userId: user.id,
      },
      success_url: `${origin}/memories/${returnId}?payment=success`,
      cancel_url: `${origin}/memories/${returnId}?payment=cancelled`,
      customer_email: user.email ?? undefined,
    });

    return Response.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('[payments] checkout session error:', error);
    return Response.json(
      { error: 'Failed to create payment session' },
      { status: 500 },
    );
  }
}
