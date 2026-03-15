'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { TripFormData, WeatherData } from '@/types';
import { TripForm } from './TripForm';

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

      // Extract weather from response headers
      const weatherHeader = response.headers.get('X-Weather-Data');
      let weather: WeatherData | null = null;
      if (weatherHeader) {
        try {
          weather = JSON.parse(decodeURIComponent(weatherHeader));
        } catch {
          // ignore parse error
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
              if (delta) {
                planContent += delta;
              }
            } catch {
              // skip
            }
          }
        }
      }

      // Store in localStorage and navigate
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
      {/* Hero Section */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-[#FF6B6B]/80 py-20 px-4 text-white"
        aria-label="Hero section"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium border border-white/30">
            <span aria-hidden="true">✨</span>
            Powered by Advanced AI
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            Plan Your Perfect Trip
            <br />
            <span className="text-white/90">with AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            Tell us about your dream trip and get a personalised, detailed travel plan in seconds —
            tailored to your style, budget, and group.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3.5 rounded-full hover:bg-sky-50 transition-all duration-200 shadow-lg hover:shadow-xl text-base"
              aria-label="Start planning your trip"
            >
              Start Planning
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <span className="text-white/70 text-sm">Free • No account required</span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-6" aria-label="App highlights">
            {[
              { value: '30s', label: 'Average generation time' },
              { value: '7', label: 'Detailed plan sections' },
              { value: '12', label: 'Trip style options' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-white/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30" aria-labelledby="how-it-works-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                emoji: '📝',
                title: 'Fill in Your Details',
                description: 'Tell us your destination, dates, travel group, preferred styles, and budget level.',
              },
              {
                step: '02',
                emoji: '🤖',
                title: 'AI Crafts Your Plan',
                description: 'Our AI analyses your preferences and generates a comprehensive, personalised itinerary.',
              },
              {
                step: '03',
                emoji: '✈️',
                title: 'Explore & Refine',
                description: 'Review your plan across 7 detailed sections and chat with AI to refine any details.',
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-2xl shadow-sm">
                    <span aria-hidden="true">{item.emoji}</span>
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                    {item.step.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section
        ref={formRef}
        className="py-16 px-4"
        aria-labelledby="form-section-heading"
        id="plan-form"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="form-section-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Create Your Travel Plan
            </h2>
            <p className="text-muted-foreground">
              Fill in the details below and we&apos;ll generate a personalised itinerary just for you.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 px-4 bg-muted/30 border-t border-border" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="features-heading" className="text-2xl font-bold text-center mb-10 text-foreground">
            What&apos;s Included in Every Plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji: '🗺️', title: 'Destination Overview', desc: 'What makes it special and must-see highlights' },
              { emoji: '🌤️', title: 'Weather & Season Info', desc: 'Real forecasts or climate averages for your dates' },
              { emoji: '📅', title: 'Day-by-Day Itinerary', desc: 'Morning, afternoon, and evening activities planned' },
              { emoji: '🏨', title: 'Accommodation Picks', desc: 'Curated hotels and stays matching your budget' },
              { emoji: '🚌', title: 'Getting Around', desc: 'Transport tips, passes, and estimated costs' },
              { emoji: '💰', title: 'Budget Breakdown', desc: 'Estimated costs per category with totals' },
              { emoji: '💡', title: 'Practical Tips', desc: 'Visas, safety, culture, food, and local apps' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <span className="text-xl mt-0.5" aria-hidden="true">{feature.emoji}</span>
                <div>
                  <p className="font-medium text-sm text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
