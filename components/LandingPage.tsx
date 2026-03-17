'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { TripFormData, WeatherData } from '@/types';
import { TripForm } from './TripForm';
import {
  Plane, AlertTriangle, ArrowRight,
  ClipboardList, Bot, Map, CloudSun, CalendarDays,
  Hotel, Bus, Wallet, Lightbulb,
} from 'lucide-react';
import { HeroSearch } from './HeroSearch';

const QUICK_CHIPS = [
  { label: 'Beach escape', destination: 'Bali, Indonesia' },
  { label: 'City break', destination: 'Paris, France' },
  { label: 'Adventure', destination: 'Queenstown, New Zealand' },
  { label: 'Cultural tour', destination: 'Kyoto, Japan' },
  { label: 'Road trip', destination: 'California, USA' },
];

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroDestination, setHeroDestination] = useState('');
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHeroSubmit = (destination: string) => {
    if (destination.trim()) setHeroDestination(destination.trim());
    scrollToForm();
  };

  const handleChipClick = (destination: string) => {
    setHeroDestination(destination);
    scrollToForm();
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
        setError(errBody.error || `Server error ${response.status}`);
        setIsLoading(false);
        return;
      }

      const weatherHeader = response.headers.get('X-Weather-Data');
      let weather: WeatherData | null = null;
      if (weatherHeader) {
        try { weather = JSON.parse(decodeURIComponent(weatherHeader)); } catch { /* ignore */ }
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
            } catch { /* skip */ }
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
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      {/*
        -mt-16 cancels the layout's pt-16 so the hero photo fills behind the
        transparent fixed navbar. min-h-screen gives full-viewport height.
      */}
      <section
        className="relative -mt-16 min-h-screen flex items-center justify-center overflow-hidden"
        aria-label="Hero section"
      >
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
        />

        {/* Deep indigo overlay with depth gradient */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'linear-gradient(135deg, rgba(18,12,80,0.84) 0%, rgba(18,12,80,0.60) 45%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Hero content */}
        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 text-center py-24">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
            className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 uppercase tracking-widest mb-7"
          >
            <span aria-hidden="true">✦</span>
            AI-Powered · Free · No account required
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.15 }}
            className="text-[clamp(52px,9vw,100px)] font-extrabold text-white leading-[0.9] tracking-[-0.03em] mb-6"
          >
            Travel<br />
            <span style={{ color: '#FF6B35' }}>Smarter,</span><br />
            Go Further.
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
            className="text-[18px] sm:text-[20px] text-white/72 font-normal leading-relaxed max-w-xl mx-auto mb-10"
          >
            Your AI travel planner. Personalised itineraries crafted in 30 seconds — tailored to your style, budget, and group.
          </motion.p>

          {/* Search pill with autocomplete */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.32 }}
            className="mb-5"
          >
            <HeroSearch onSubmit={handleHeroSubmit} />
          </motion.div>

          {/* Quick chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.40 }}
            className="flex flex-wrap justify-center gap-2"
            aria-label="Quick destination suggestions"
          >
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.destination)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white/90 border border-white/25 hover:bg-white/20 hover:text-white transition-all duration-200 bg-white/12"
              >
                {chip.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40" aria-hidden="true">
          <div className="w-px h-8 bg-white/20 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ──────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-[#0a0a14] dark:bg-[#0a0a0a]" aria-label="Highlights">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            {[
              { value: '30s', label: 'Plan generated' },
              { value: '7', label: 'Detailed sections' },
              { value: '12', label: 'Trip styles' },
              { value: '100%', label: 'Free to use' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-3xl sm:text-4xl font-extrabold leading-none text-[#FF6B35]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-white/45 mt-1.5 uppercase tracking-widest font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-background" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B35] mb-3">Simple process</p>
            <h2 id="how-it-works-heading" className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              How it works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {[
              {
                icon: <ClipboardList className="w-7 h-7 text-[#FF6B35]" aria-hidden="true" />,
                title: 'Fill in your details',
                description: 'Destination, dates, group size, travel style, and budget — one clean form.',
              },
              {
                icon: <Bot className="w-7 h-7 text-[#FF6B35]" aria-hidden="true" />,
                title: 'AI crafts your plan',
                description: 'Our AI builds a comprehensive, personalised itinerary in under 30 seconds.',
              },
              {
                icon: <Plane className="w-7 h-7 text-[#FF6B35]" aria-hidden="true" />,
                title: 'Explore & refine',
                description: 'Browse 7 detailed sections and chat with AI to tweak any part of your trip.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                className="relative bg-card rounded-2xl p-7 border border-border hover:shadow-xl hover:border-transparent transition-all duration-300 group"
              >
                {/* Watermark step number */}
                <span
                  className="absolute top-5 right-6 text-5xl font-extrabold text-foreground/[0.04] select-none leading-none"
                  aria-hidden="true"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  0{i + 1}
                </span>

                <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center mb-5 group-hover:bg-[#FF6B35]/15 transition-colors">
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                {/* Arrow connector */}
                {i < 2 && (
                  <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#FF6B35] items-center justify-center shadow-lg">
                    <ArrowRight className="w-3 h-3 text-white" aria-hidden="true" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM SECTION ──────────────────────────────────────────────── */}
      <section
        ref={formRef}
        className="py-24 px-4 bg-muted/20 border-t border-border/60"
        aria-labelledby="form-section-heading"
        id="plan-form"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B35] mb-3">
              Your adventure starts here
            </p>
            <h2 id="form-section-heading" className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              Create your travel plan
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Tell us about your dream trip and we&apos;ll craft a personalised itinerary just for you.
            </p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span><strong>Error:</strong> {error}</span>
            </div>
          )}

          <TripForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            defaultDestination={heroDestination}
          />
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-background border-t border-border/60" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B35] mb-3">Full coverage</p>
            <h2 id="features-heading" className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              What&apos;s included in every plan
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Map className="w-5 h-5" />, title: 'Destination Overview', desc: 'What makes it special and must-see highlights' },
              { icon: <CloudSun className="w-5 h-5" />, title: 'Weather & Season', desc: 'Real forecasts or climate averages for your dates' },
              { icon: <CalendarDays className="w-5 h-5" />, title: 'Day-by-Day Itinerary', desc: 'Morning, afternoon, and evening activities planned' },
              { icon: <Hotel className="w-5 h-5" />, title: 'Accommodation Picks', desc: 'Curated stays matching your budget' },
              { icon: <Bus className="w-5 h-5" />, title: 'Getting Around', desc: 'Transport tips, passes, and estimated costs' },
              { icon: <Wallet className="w-5 h-5" />, title: 'Budget Breakdown', desc: 'Estimated costs per category with totals' },
              { icon: <Lightbulb className="w-5 h-5" />, title: 'Practical Tips', desc: 'Visas, safety, culture, food, and local apps' },
              { icon: <Bot className="w-5 h-5" />, title: 'AI Chat', desc: 'Ask questions and refine any detail in real time' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: (i % 4) * 0.06 }}
                className="group flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border hover:border-[#FF6B35]/30 hover:shadow-lg transition-all duration-300 cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FF6B35] bg-[#FF6B35]/8 group-hover:bg-[#FF6B35]/14 transition-colors"
                  aria-hidden="true"
                >
                  {feature.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground leading-tight mb-1">{feature.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
