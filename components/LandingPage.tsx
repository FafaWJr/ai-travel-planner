'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { TripFormData, WeatherData } from '@/types';
import { TripForm } from './TripForm';
import {
  Plane, Sparkles, ChevronDown, AlertTriangle,
  ClipboardList, Bot, Map, CloudSun, CalendarDays,
  Hotel, Bus, Wallet, Lightbulb,
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
      <section className="relative overflow-hidden min-h-[560px] flex items-center py-24 px-4 text-white" aria-label="Hero section">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80')" }}
          aria-hidden="true"
        />
        {/* Dark + colour overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-sky-900/70 to-slate-900/75" aria-hidden="true" />

        <div className="relative w-full max-w-4xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium border border-white/25">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Powered by Advanced AI
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Plan Your Perfect Trip
            <br />
            <span className="text-sky-300">with AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-medium">
            Tell us about your dream trip and get a personalised, detailed travel plan in seconds —
            tailored to your style, budget, and group.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2.5 bg-white text-sky-700 font-bold px-8 py-3.5 rounded-full hover:bg-sky-50 transition-all duration-200 shadow-xl hover:shadow-2xl text-base tracking-tight"
              aria-label="Start planning your trip"
            >
              <Plane className="w-4 h-4" aria-hidden="true" />
              Start Planning
              <ChevronDown className="w-4 h-4 opacity-60" aria-hidden="true" />
            </button>
            <span className="text-white/60 text-sm font-medium">Free · No account required</span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 pt-4" aria-label="App highlights">
            {[
              { value: '30s', label: 'Plan generated' },
              { value: '7', label: 'Plan sections' },
              { value: '12', label: 'Trip styles' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-sky-300">{stat.value}</p>
                <p className="text-xs text-white/60 font-medium mt-0.5 uppercase tracking-wider">{stat.label}</p>
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
                icon: <ClipboardList className="w-7 h-7 text-sky-600 dark:text-sky-400" aria-hidden="true" />,
                title: 'Fill in Your Details',
                description: 'Tell us your destination, dates, travel group, preferred styles, and budget level.',
              },
              {
                step: '02',
                icon: <Bot className="w-7 h-7 text-sky-600 dark:text-sky-400" aria-hidden="true" />,
                title: 'AI Crafts Your Plan',
                description: 'Our AI analyses your preferences and generates a comprehensive, personalised itinerary.',
              },
              {
                step: '03',
                icon: <Plane className="w-7 h-7 text-sky-600 dark:text-sky-400" aria-hidden="true" />,
                title: 'Explore & Refine',
                description: 'Review your plan across 7 detailed sections and chat with AI to refine any details.',
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shadow-sm">
                    {item.icon}
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
        className="py-16 px-4 bg-gradient-to-b from-sky-50/60 via-background to-background dark:from-sky-950/20 dark:via-background dark:to-background"
        aria-labelledby="form-section-heading"
        id="plan-form"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-900/40 rounded-full px-4 py-1.5 text-sm font-semibold text-sky-700 dark:text-sky-300 mb-4">
              <Plane className="w-3.5 h-3.5" aria-hidden="true" />
              Your adventure starts here
            </div>
            <h2 id="form-section-heading" className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
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

      {/* Feature Highlights */}
      <section className="py-16 px-4 bg-muted/30 border-t border-border" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="features-heading" className="text-2xl font-bold text-center mb-10 text-foreground">
            What&apos;s Included in Every Plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: <Map className="w-4 h-4 text-sky-500" />, title: 'Destination Overview', desc: 'What makes it special and must-see highlights' },
              { icon: <CloudSun className="w-4 h-4 text-sky-500" />, title: 'Weather & Season Info', desc: 'Real forecasts or climate averages for your dates' },
              { icon: <CalendarDays className="w-4 h-4 text-sky-500" />, title: 'Day-by-Day Itinerary', desc: 'Morning, afternoon, and evening activities planned' },
              { icon: <Hotel className="w-4 h-4 text-sky-500" />, title: 'Accommodation Picks', desc: 'Curated hotels and stays matching your budget' },
              { icon: <Bus className="w-4 h-4 text-sky-500" />, title: 'Getting Around', desc: 'Transport tips, passes, and estimated costs' },
              { icon: <Wallet className="w-4 h-4 text-sky-500" />, title: 'Budget Breakdown', desc: 'Estimated costs per category with totals' },
              { icon: <Lightbulb className="w-4 h-4 text-sky-500" />, title: 'Practical Tips', desc: 'Visas, safety, culture, food, and local apps' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <div className="mt-0.5 shrink-0" aria-hidden="true">{feature.icon}</div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{feature.title}</p>
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
