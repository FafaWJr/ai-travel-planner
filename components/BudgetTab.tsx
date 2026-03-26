'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ItineraryHandle, Day } from './EditableItinerary';
import type { AcceptedHotel } from './StayTab';

/* ─── Types ──────────────────────────────────────────────────── */
type Currency = 'USD' | 'EUR' | 'AUD' | 'BRL';

interface BudgetItem {
  label: string;
  category: 'accommodation' | 'activity' | 'meal' | 'transport' | 'other';
  status: 'accepted' | 'pending';
  unit_cost: number;
  travelers: number;
  subtotal: number;
  note: string;
}

interface BudgetDay {
  day: number;
  title: string;
  confirmed_total: number;
  items: BudgetItem[];
}

interface BudgetSummary {
  accommodation: number;
  activities: number;
  meals: number;
  transport: number;
  other: number;
  confirmed_total: number;
  pending_total: number;
}

interface BudgetResult {
  currency: string;
  summary: BudgetSummary;
  by_day: BudgetDay[];
  no_hotel_warning?: boolean;
}

interface ExchangeRates {
  rates: Record<Currency, number>;
  fetchedAt: string | null;
  fallback: boolean;
}

interface Props {
  itineraryRef: React.RefObject<ItineraryHandle | null>;
  acceptedHotels: AcceptedHotel[];
  prompt: string;
  version: number; // increments when itinerary changes
}

/* ─── Currency config ────────────────────────────────────────── */
const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$',   label: 'US Dollar' },
  { code: 'EUR', symbol: '€',   label: 'Euro' },
  { code: 'AUD', symbol: 'A$',  label: 'AUD' },
  { code: 'BRL', symbol: 'R$',  label: 'Real' },
];

function fmt(amount: number, symbol: string, code: Currency): string {
  if (code === 'BRL') {
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function convert(usd: number, rates: Record<Currency, number>, to: Currency): number {
  // Our base is USD; rates are EUR-based so convert via EUR
  // rates.USD = USD per 1 EUR, so 1 USD = 1/rates.USD EUR
  // Actually our API returns EUR-based rates. To convert from USD:
  // USD → EUR → target
  const eurPerUsd = 1 / rates.USD;       // how many EUR per 1 USD
  const eur = usd * eurPerUsd;
  return eur * rates[to];
}

const CATEGORY_ICONS: Record<string, string> = {
  accommodation: '🏨',
  activity:      '🎭',
  meal:          '🍽️',
  transport:     '🚌',
  other:         '📦',
};

/* ─── Summary card ───────────────────────────────────────────── */
function SummaryCard({ label, amount, symbol, currency, color }: {
  label: string; amount: number; symbol: string; currency: Currency; color: string;
}) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${color}22`, borderRadius: 12, padding: '14px 16px' }}>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color, margin: 0 }}>
        {fmt(amount, symbol, currency)}
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function BudgetTab({ itineraryRef, acceptedHotels, prompt, version }: Props) {
  const [budget,       setBudget]       = useState<BudgetResult | null>(null);
  const [rates,        setRates]        = useState<ExchangeRates | null>(null);
  const [currency,     setCurrency]     = useState<Currency>('USD');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [stale,        setStale]        = useState(false);
  const [openDays,     setOpenDays]     = useState<Set<number>>(new Set([1]));
  const lastVersion         = useRef(-1);
  const prevHotelCount      = useRef(acceptedHotels.length);

  // When itinerary version changes after first calc, mark as stale
  useEffect(() => {
    if (lastVersion.current === -1) return;
    setStale(true);
  }, [version]); // eslint-disable-line

  // When hotel is confirmed/removed after first calc, mark as stale
  useEffect(() => {
    if (lastVersion.current === -1) { prevHotelCount.current = acceptedHotels.length; return; }
    if (acceptedHotels.length !== prevHotelCount.current) {
      prevHotelCount.current = acceptedHotels.length;
      setStale(true);
    }
  }, [acceptedHotels]); // eslint-disable-line

  // Fetch exchange rates client-side (Frankfurter supports CORS)
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,AUD,BRL')
      .then(r => r.json())
      .then(data => {
        setRates({
          rates: { EUR: 1.0, USD: data.rates.USD, AUD: data.rates.AUD, BRL: data.rates.BRL },
          fetchedAt: new Date().toISOString(),
          fallback: false,
        });
      })
      .catch(() => {
        setRates({
          rates: { EUR: 1.0, USD: 1.09, AUD: 1.68, BRL: 5.94 },
          fetchedAt: null,
          fallback: true,
        });
      });
  }, []);

  // Extract trip metadata from prompt
  const parseTripMeta = useCallback(() => {
    const startMatch = prompt.match(/from (\d{4}-\d{2}-\d{2})/);
    const endMatch   = prompt.match(/to (\d{4}-\d{2}-\d{2})/);
    const start = startMatch?.[1] || '';
    const end   = endMatch?.[1]   || '';
    let nights = 0;
    if (start && end) {
      nights = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
    }
    const adultsMatch   = prompt.match(/(\d+)\s+adult/i);
    const childrenMatch = prompt.match(/(\d+)\s+child/i);
    const travelers = (parseInt(adultsMatch?.[1] || '1') + parseInt(childrenMatch?.[1] || '0')) || 1;
    const dest = prompt.replace(/^plan a (trip to |)?/i, '').replace(/\b(from \d{4}-\d{2}-\d{2}.*)$/i, '').trim().split(' ').slice(0, 6).join(' ');
    const budgetLevel = /luxury/i.test(prompt) ? 'luxury' : /premium/i.test(prompt) ? 'premium' : /budget/i.test(prompt) ? 'budget' : 'comfortable';
    return { start, end, nights, travelers, dest, budgetLevel };
  }, [prompt]);

  const calculate = useCallback(async () => {
    const days: Day[] = itineraryRef.current?.getDaysSnapshot() ?? [];
    if (days.length === 0) {
      setError('No itinerary data found. Please generate a trip first.');
      return;
    }

    const { start, end, nights, travelers, dest, budgetLevel } = parseTripMeta();
    const hotel = acceptedHotels[0] ? {
      name: acceptedHotels[0].hotel.name,
      neighborhood: acceptedHotels[0].hotel.neighborhood,
      priceRange: acceptedHotels[0].hotel.priceRange,
    } : null;

    setLoading(true);
    setError('');
    setStale(false);
    lastVersion.current = version;

    try {
      const res = await fetch('/api/budget-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest,
          startDate: start,
          endDate: end,
          nights,
          travelers,
          hotel,
          days: days.map(d => ({
            number: d.number,
            title: d.title,
            activities: d.activities.map(a => ({
              status: a.status,
              slot: a.slot,
              text: a.text,
            })),
          })),
          budgetLevel,
        }),
      });
      if (!res.ok) throw new Error('Failed to estimate budget');
      const data: BudgetResult = await res.json();
      if ((data as any).error) throw new Error((data as any).error);
      setBudget(data);
    } catch (e: any) {
      setError(e.message || 'Could not calculate budget. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [itineraryRef, acceptedHotels, parseTripMeta, version]);

  // No auto-calc on mount — user triggers first estimate so hotel/itinerary are ready

  const toggleDay = (n: number) =>
    setOpenDays(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });

  const sym = CURRENCIES.find(c => c.code === currency)?.symbol ?? '$';

  const conv = (usd: number) =>
    rates ? convert(usd, rates.rates, currency) : usd;

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: '#00447B', margin: '0 0 4px' }}>
            Budget Estimator
          </h2>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#6C6D6F', margin: 0 }}>
            Based on your accepted activities and confirmed hotel
          </p>
        </div>

        {/* Currency switcher */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12,
                fontFamily: "'Poppins',sans-serif", fontWeight: 600,
                border: `1.5px solid ${currency === c.code ? '#FF8210' : 'rgba(0,68,123,0.15)'}`,
                background: currency === c.code ? '#FF8210' : '#fff',
                color: currency === c.code ? '#fff' : '#00447B',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>
      </div>

      {/* ── No hotel warning ── */}
      {!loading && budget?.no_hotel_warning && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.30)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⚠️</span>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#92400E', margin: 0 }}>
            No accommodation confirmed. Open the <strong>Stays</strong> tab to choose a hotel — this will make your budget more accurate.
          </p>
        </div>
      )}

      {/* ── Stale banner ── */}
      {stale && !loading && (
        <div style={{ background: 'rgba(255,130,16,0.07)', border: '1.5px dashed rgba(255,130,16,0.40)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#92400E', margin: 0 }}>
            Your itinerary changed. Recalculate to update the budget.
          </p>
          <button onClick={calculate} style={{ background: '#FF8210', color: '#fff', border: 'none', borderRadius: 100, padding: '7px 16px', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Recalculate
          </button>
        </div>
      )}

      {/* ── First-time CTA ── */}
      {!loading && !budget && !error && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1.5px solid rgba(0,68,123,0.08)', boxShadow: '0 2px 20px rgba(0,68,123,0.07)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,68,123,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>💰</div>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 16, color: '#00447B', margin: '0 0 8px' }}>Get your budget estimate</p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#6C6D6F', margin: '0 0 20px', lineHeight: 1.6 }}>
            AI will analyse your accepted activities{acceptedHotels.length > 0 ? ' and confirmed hotel' : ''} to build a realistic cost breakdown.
          </p>
          <button
            onClick={calculate}
            style={{ background: '#FF8210', color: '#fff', border: 'none', borderRadius: 100, padding: '11px 28px', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Generate Budget Estimate
          </button>
          {acceptedHotels.length === 0 && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#9CA3AF', margin: '12px 0 0' }}>
              Tip: confirm a hotel in the <strong>Stays</strong> tab first for a more accurate accommodation estimate.
            </p>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1.5px solid rgba(0,68,123,0.08)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.10)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15, color: '#00447B', marginBottom: 6 }}>Estimating your budget...</p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#9CA3AF' }}>Analysing accepted activities and confirmed stays</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', border: '1.5px solid rgba(220,38,38,0.15)' }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error}</p>
          <button onClick={calculate} style={{ background: '#FF8210', color: '#fff', border: 'none', borderRadius: 100, padding: '9px 22px', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {!loading && !error && budget && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'linear-gradient(135deg,#00447B,#0369A1)', borderRadius: 14, padding: '18px 20px', gridColumn: '1/-1' }}>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirmed Total</p>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 32, color: '#fff', margin: 0 }}>
                {fmt(conv(budget.summary.confirmed_total), sym, currency)}
              </p>
              {budget.summary.pending_total > 0 && (
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                  + {fmt(conv(budget.summary.pending_total), sym, currency)} pending
                </p>
              )}
            </div>

            <SummaryCard label="Accommodation" amount={conv(budget.summary.accommodation)} symbol={sym} currency={currency} color="#00447B" />
            <SummaryCard label="Activities"    amount={conv(budget.summary.activities)}    symbol={sym} currency={currency} color="#7C3AED" />
            <SummaryCard label="Meals"         amount={conv(budget.summary.meals)}         symbol={sym} currency={currency} color="#EA580C" />
            <SummaryCard label="Transport"     amount={conv(budget.summary.transport)}     symbol={sym} currency={currency} color="#0284C7" />
            {budget.summary.other > 0 && (
              <SummaryCard label="Other" amount={conv(budget.summary.other)} symbol={sym} currency={currency} color="#6C6D6F" />
            )}
          </div>

          {/* Recalculate button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={calculate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1.5px solid rgba(0,68,123,0.20)',
                borderRadius: 100, padding: '7px 16px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12, color: '#00447B',
                cursor: 'pointer',
              }}
            >
              🔄 Recalculate
            </button>
          </div>

          {/* Day-by-day breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {budget.by_day.map(day => {
              const isOpen = openDays.has(day.day);
              const confirmedItems = day.items.filter(i => i.status === 'accepted');
              const pendingItems   = day.items.filter(i => i.status === 'pending');

              return (
                <div key={day.day} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(0,68,123,0.08)', overflow: 'hidden' }}>
                  {/* Day header */}
                  <button
                    onClick={() => toggleDay(day.day)}
                    style={{
                      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ background: '#00447B', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 100, flexShrink: 0 }}>Day {day.day}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{day.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: '#00447B' }}>
                        {fmt(conv(day.confirmed_total), sym, currency)}
                      </span>
                      <span style={{ color: '#9CA3AF', fontSize: 12, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                    </div>
                  </button>

                  {/* Items list */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid rgba(0,68,123,0.07)', padding: '0 0 4px' }}>
                      {confirmedItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '10px 16px', borderBottom: i < confirmedItems.length - 1 ? '1px solid rgba(0,68,123,0.05)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{CATEGORY_ICONS[item.category] ?? '📌'}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#333', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                              {item.note && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF', margin: 0 }}>{item.note}</p>}
                            </div>
                          </div>
                          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#00447B', flexShrink: 0 }}>
                            {fmt(conv(item.subtotal), sym, currency)}
                          </span>
                        </div>
                      ))}

                      {pendingItems.length > 0 && (
                        <div style={{ margin: '8px 12px', border: '1.5px dashed rgba(0,68,123,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Pending / Not confirmed</p>
                          {pendingItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', opacity: 0.65 }}>
                              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#555' }}>{CATEGORY_ICONS[item.category]} {item.label}</span>
                              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#9CA3AF' }}>~{fmt(conv(item.subtotal), sym, currency)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Exchange rate disclaimer */}
          {rates && (
            <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(0,68,123,0.04)', borderRadius: 10 }}>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                {rates.fallback
                  ? '⚠️ Using approximate exchange rates (live rates unavailable). '
                  : `Rates updated ${rates.fetchedAt ? new Date(rates.fetchedAt).toLocaleString() : 'recently'}. `}
                Rates are indicative and may vary at time of payment.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
