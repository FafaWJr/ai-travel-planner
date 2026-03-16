'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { TripFormData, WeatherData } from '@/types';
import { TripForm } from './TripForm';
import {
  Plane, Sparkles, AlertTriangle,
  ClipboardList, Bot, Map, CloudSun, CalendarDays,
  Hotel, Bus, Wallet, Lightbulb, ArrowRight,
} from 'lucide-react';

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (data: TripFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok || !response.body) {
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody.error || `Server error ${response.status}`;
        setError(msg);
        setIsLoading(false);
        return;
      }

      const weatherHeader = response.headers.get('X-Weather-Data');
      let weather: WeatherData | null = null;
      if (weatherHeader) {
        try {
          weather = JSON.parse(decodeURIComponent(weatherHeader));
        } catch {
          // ignore
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let planContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const parsed = JSON.parse(raw);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) planContent += delta;
            } catch {
              // skip
            }
          }
        }
      }

      localStorage.setItem('travel-plan', JSON.stringify({
        content: planContent,
        formData: data,
        weather,
        generatedAt: new Date().toISOString(),
      }));

      router.push('/plan');
    } catch (err: any) {
      setError(err.message || 'Unexpected error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative bg-white dark:bg-background overflow-hidden"
        aria-label="Hero section"
      >
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-500" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">

            {/* Left: typography block */}
            <div className="pb-14 lg:pb-20 space-y-6">
              <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full px-3.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                AI-Powered Planning
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[0.92] tracking-tighter uppercase">
                Travel
                <br />
                <span className="text-sky-500">Around</span>
                <br />
                The World
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
                Tell us about your dream destination and get a personalised, detailed travel plan in seconds — tailored to your style, budget, and group.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-sky-200 dark:shadow-sky-900/40 text-sm tracking-wide"
                  aria-label="Start planning your trip"
                >
                  <Plane className="w-4 h-4" aria-hidden="true" />
                  Start Planning
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="inline-flex items-center text-muted-foreground text-sm font-medium">
                  Free · No account required
                </span>
              </div>

              {/* Stats row */}
              <div className="flex gap-8 pt-4 border-t border-border">
                {[
                  { value: '30s', label: 'Plan generated' },
                  { value: '7', label: 'Plan sections' },
                  { value: '12', label: 'Trip styles' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: airplane photo card */}
            <div className="relative lg:self-end hidden sm:block">
              {/* Card */}
              <div className="relative rounded-t-3xl overflow-hidden shadow-2xl h-[420px] lg:h-[480px]">
                <img
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80"
                  alt="Airplane wing over clouds"
                  className="w-full h-full object-cover"
                />
                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

                {/* Floating info pill */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3">
                  <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3 flex-1">
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Your next destination</p>
                    <p className="text-white font-bold text-base leading-tight mt-0.5">Anywhere you dream of</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shrink-0">
                    <Plane className="w-5 h-5 text-white rotate-45" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Floating badge — top right */}
              <div className="absolute top-5 right-5 bg-white dark:bg-card border border-border rounded-2xl px-3.5 py-2.5 shadow-xl">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI-Crafted</p>
                <p className="text-sm font-extrabold text-foreground">Personalised Plan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30 border-t border-border" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-2">Simple Process</p>
            <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <ClipboardList className="w-6 h-6 text-sky-500" aria-hidden="true" />,
                title: 'Fill in Your Details',
                description: 'Destination, dates, group size, travel style, and budget — all in one form.',
              },
              {
                step: '02',
                icon: <Bot className="w-6 h-6 text-sky-500" aria-hidden="true" />,
                title: 'AI Crafts Your Plan',
                description: 'Our AI analyses your preferences and builds a comprehensive personalised itinerary.',
              },
              {
                step: '03',
                icon: <Plane className="w-6 h-6 text-sky-500" aria-hidden="true" />,
                title: 'Explore & Refine',
                description: 'Browse 7 detailed sections and chat with AI to tweak any part of your trip.',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative bg-card border border-border rounded-2xl p-6 shadow-sm">
                {/* Step number */}
                <span className="absolute top-5 right-5 text-4xl font-extrabold text-muted/40 select-none leading-none">
                  {item.step}
                </span>
                <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                {/* Connector arrow (between cards) */}
                {i < 2 && (
                  <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-sky-500 items-center justify-center shadow-md">
                    <ArrowRight className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form Section ─────────────────────────────────────── */}
      <section
        ref={formRef}
        className="py-20 px-4 bg-background"
        aria-labelledby="form-section-heading"
        id="plan-form"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-2">Your adventure starts here</p>
            <h2 id="form-section-heading" className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Create Your Travel Plan
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Tell us about your dream trip and we&apos;ll craft a personalised itinerary just for you.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span><strong>Error:</strong> {error}</span>
            </div>
          )}
          <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </section>

      {/* ── What's Included ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30 border-t border-border" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-2">Full coverage</p>
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              What&apos;s Included in Every Plan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Map className="w-5 h-5 text-sky-500" />, title: 'Destination Overview', desc: 'What makes it special and must-see highlights' },
              { icon: <CloudSun className="w-5 h-5 text-sky-500" />, title: 'Weather & Season', desc: 'Real forecasts or climate averages for your dates' },
              { icon: <CalendarDays className="w-5 h-5 text-sky-500" />, title: 'Day-by-Day Itinerary', desc: 'Morning, afternoon, and evening activities' },
              { icon: <Hotel className="w-5 h-5 text-sky-500" />, title: 'Accommodation Picks', desc: 'Curated stays matching your budget' },
              { icon: <Bus className="w-5 h-5 text-sky-500" />, title: 'Getting Around', desc: 'Transport tips, passes, and estimated costs' },
              { icon: <Wallet className="w-5 h-5 text-sky-500" />, title: 'Budget Breakdown', desc: 'Estimated costs per category with totals' },
              { icon: <Lightbulb className="w-5 h-5 text-sky-500" />, title: 'Practical Tips', desc: 'Visas, safety, culture, food, and local apps' },
              { icon: <Bot className="w-5 h-5 text-sky-500" />, title: 'AI Chat', desc: 'Ask follow-up questions or refine any detail' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50 transition-colors" aria-hidden="true">
                  {feature.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
