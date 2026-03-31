/**
 * Analytics event tracking library.
 * Sends events to GA4, Meta Pixel, Twitter/X Pixel, and TikTok Pixel.
 * All functions are client-safe (guarded with typeof window check).
 */

declare global {
  interface Window {
    gtag:    (...args: unknown[]) => void;
    fbq:     (...args: unknown[]) => void;
    twq:     (...args: unknown[]) => void;
    ttq:     { track: (event: string, params?: Record<string, unknown>) => void; page: () => void };
    dataLayer: unknown[];
  }
}

type Params = Record<string, string | number | boolean | undefined>;

function isClient() {
  return typeof window !== 'undefined';
}

// ─── Core senders ────────────────────────────────────────────────────────────

function ga(event: string, params?: Params) {
  if (!isClient() || !window.gtag) return;
  window.gtag('event', event, params);
}

function meta(event: string, params?: Params) {
  if (!isClient() || !window.fbq) return;
  window.fbq('track', event, params);
}

function twitter(event: string, params?: Params) {
  if (!isClient() || !window.twq) return;
  window.twq('event', event, params);
}

function tiktok(event: string, params?: Params) {
  if (!isClient() || !window.ttq) return;
  window.ttq.track(event, params);
}

// ─── Page View (called on SPA route change) ───────────────────────────────

export function trackPageView(path: string, title?: string) {
  ga('page_view', { page_path: path, page_title: title });
  meta('PageView');
  twitter('PageView');
  if (isClient() && window.ttq) window.ttq.page();
}

// ─── CTA / Button Clicks ─────────────────────────────────────────────────

export function trackCTAClick(buttonName: string, location: string) {
  ga('cta_click', { button_name: buttonName, location });
  meta('ViewContent',  { content_name: buttonName, content_category: location });
  twitter('ViewContent');
  tiktok('ClickButton', { content_name: buttonName });
}

// ─── Trip Planning Funnel ─────────────────────────────────────────────────

/** User lands on /start or submits a destination to plan */
export function trackTripPlanStarted(destination: string) {
  ga('trip_plan_started', { destination, event_category: 'funnel' });
  meta('InitiateCheckout', { content_name: destination, content_category: 'trip_planning' });
  twitter('tw-initiateCheckout');
  tiktok('InitiateCheckout', { content_name: destination });
}

/** AI successfully returns a full travel plan */
export function trackTripPlanGenerated(destination: string) {
  ga('generate_lead', { destination, event_category: 'conversion' });
  meta('Lead', { content_name: destination, content_category: 'trip_plan_generated' });
  twitter('tw-lead');
  tiktok('SubmitForm', { content_name: destination });
}

// ─── Destination Discovery ────────────────────────────────────────────────

/** User clicks "Plan this trip" on a destination card */
export function trackDestinationSelected(destination: string, category: string) {
  ga('select_item', { item_list_name: 'trip_ideas', destination, category });
  meta('ViewContent', { content_name: destination, content_category: category });
  twitter('ViewContent');
  tiktok('ViewContent', { content_name: destination, content_category: category });
}

// ─── Quiz ─────────────────────────────────────────────────────────────────

export function trackQuizStarted() {
  ga('tutorial_begin', { event_category: 'quiz' });
  meta('ViewContent', { content_name: 'traveller_quiz', content_category: 'quiz' });
  tiktok('ViewContent', { content_name: 'traveller_quiz' });
}

export function trackQuizStepCompleted(step: number, stepName: string) {
  ga('quiz_step_completed', { step_number: step, step_name: stepName, event_category: 'quiz' });
}

export function trackQuizCompleted(persona: string) {
  ga('tutorial_complete', { persona, event_category: 'quiz' });
  meta('Lead', { content_name: persona, content_category: 'quiz_completed' });
  twitter('tw-lead');
  tiktok('CompleteRegistration', { content_name: persona });
}

// ─── Authentication ───────────────────────────────────────────────────────

export function trackSignUpStarted(method: 'email' | 'google') {
  ga('sign_up_started', { method });
  meta('ViewContent', { content_name: 'signup_form', content_category: 'auth' });
  tiktok('ViewContent', { content_name: 'signup' });
}

export function trackSignUpCompleted(method: 'email' | 'google') {
  ga('sign_up', { method });
  meta('CompleteRegistration', { content_name: 'account_created', status: method });
  twitter('tw-completeRegistration');
  tiktok('CompleteRegistration', { content_name: 'account_created' });
}

export function trackLoginCompleted(method: 'email' | 'google') {
  ga('login', { method });
}

// ─── AI Chat ─────────────────────────────────────────────────────────────

export function trackChatMessageSent(context: 'plan' | 'floating') {
  ga('chat_message_sent', { context, event_category: 'engagement' });
  tiktok('ClickButton', { content_name: 'chat_with_luna', context });
}
