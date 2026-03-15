'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TripFormData, WeatherData } from '@/types';
import { TripPlanResult } from './TripPlanResult';
import { ChatBox } from './ChatBox';

interface StoredPlanData {
  content: string;
  formData: TripFormData;
  weather: WeatherData | null;
  generatedAt: string;
}

export function PlanPageClient() {
  const router = useRouter();
  const [planData, setPlanData] = useState<StoredPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('travel-plan');
      if (!stored) {
        router.replace('/');
        return;
      }

      const parsed: StoredPlanData = JSON.parse(stored);
      if (!parsed.content || !parsed.formData) {
        router.replace('/');
        return;
      }

      setPlanData(parsed);
    } catch {
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded-xl w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!planData) return null;

  const { content, formData, weather } = planData;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => router.push('/')}
              className="hover:text-foreground transition-colors flex items-center gap-1"
              aria-label="Back to home"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              New Plan
            </button>
            <span aria-hidden="true">/</span>
            <span>{formData.destination}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Your Trip to{' '}
            <span className="text-sky-500">{formData.destination}</span>
          </h1>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span aria-hidden="true">📅</span>
              {new Date(formData.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' — '}
              {new Date(formData.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true">👥</span>
              {formData.adults} adult{formData.adults !== 1 ? 's' : ''}
              {formData.children > 0 && `, ${formData.children} child${formData.children !== 1 ? 'ren' : ''}`}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true">💰</span>
              {formData.budgetLevel === 'budget' ? 'Budget Friendly' : formData.budgetLevel === 'mid-range' ? 'Mid Range' : 'Premium'}
            </span>
          </div>
        </div>

        {/* Travel Plan */}
        <section aria-labelledby="travel-plan-heading">
          <h2 id="travel-plan-heading" className="sr-only">Your Travel Plan</h2>
          <TripPlanResult
            content={content}
            isStreaming={false}
            destination={formData.destination}
            weather={weather}
          />
        </section>

        {/* Chat Section */}
        <section aria-labelledby="chat-heading">
          <h2 id="chat-heading" className="text-xl font-bold text-foreground mb-4">
            Refine Your Plan with AI
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Ask questions, get alternative suggestions, or adjust any part of your itinerary.
          </p>
          <ChatBox
            tripContext={content}
            destination={formData.destination}
          />
        </section>
      </div>
    </main>
  );
}
