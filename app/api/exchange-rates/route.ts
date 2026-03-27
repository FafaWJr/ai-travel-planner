import { NextResponse } from 'next/server';

// Fallback rates (approximate — used only when live fetch fails)
const FALLBACK = { EUR: 1.0, USD: 1.09, AUD: 1.68, BRL: 5.94 };

export async function GET() {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=EUR&to=USD,AUD,BRL',
      { next: { revalidate: 3600 } } // cache 1h server-side
    );
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = await res.json();
    const rates = { EUR: 1.0, USD: data.rates.USD, AUD: data.rates.AUD, BRL: data.rates.BRL };
    return NextResponse.json({ rates, fetchedAt: new Date().toISOString(), fallback: false });
  } catch {
    return NextResponse.json({
      rates: FALLBACK,
      fetchedAt: null,
      fallback: true,
    });
  }
}
