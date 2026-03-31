'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackChatMessageSent } from '@/lib/analytics';
import type { TripFormData, WeatherData } from '@/types';
import { TripPlanResult } from './TripPlanResult';
import { ChatBox } from './ChatBox';
import { BookingCTAs } from './BookingCTAs';
import { DestinationPhotoGallery } from './DestinationPhotoGallery';
import { Bot, MessageSquare, X, CalendarDays, Users, Wallet, ArrowLeft } from 'lucide-react';

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
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Always start at the top of the page
    window.scrollTo({ top: 0, behavior: 'instant' });

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

  const openChat = () => {
    setChatOpen(true);
    trackChatMessageSent('plan');
    // Give the DOM a tick to render the chat, then scroll to it
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

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
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              New Plan
            </button>
            <span aria-hidden="true">/</span>
            <span>{formData.destination}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Your Trip to{' '}
            <span className="text-sky-500">{formData.destination}</span>
          </h1>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
              {new Date(formData.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' — '}
              {new Date(formData.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
              {formData.adults} adult{formData.adults !== 1 ? 's' : ''}
              {formData.children > 0 && `, ${formData.children} child${formData.children !== 1 ? 'ren' : ''}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
              {formData.budgetLevel === 'budget' ? 'Budget Friendly' : formData.budgetLevel === 'mid-range' ? 'Mid Range' : 'Premium'}
            </span>
          </div>
        </div>

        {/* Photo Gallery */}
        <DestinationPhotoGallery destination={formData.destination} />

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

        {/* Booking CTAs */}
        <BookingCTAs destination={formData.destination} formData={formData} />

        {/* Chat Section */}
        <section ref={chatRef} aria-labelledby="chat-heading">
          {!chatOpen ? (
            /* Collapsed CTA */
            <div className="rounded-2xl border-2 border-dashed border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 id="chat-heading" className="text-base font-bold text-foreground mb-1">
                  Have questions about your plan?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ask the AI to tweak your itinerary, suggest alternatives, or answer anything about {formData.destination}.
                </p>
              </div>
              <button
                onClick={openChat}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Chat with AI
              </button>
            </div>
          ) : (
            /* Expanded chat */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="chat-heading" className="text-xl font-bold text-foreground">
                    Chat with AI
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Ask questions, get alternatives, or refine any part of your itinerary.
                  </p>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <ChatBox
                tripContext={content}
                destination={formData.destination}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
