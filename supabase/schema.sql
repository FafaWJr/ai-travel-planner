-- ============================================================
-- Luna Let's Go — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 2. PROFILES
--    Auto-created on signup via trigger (see bottom of file).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. TRAVEL PERSONAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.travel_personas (
  id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  persona_type            text,           -- e.g. 'adventurer', 'luxury', 'backpacker', 'family', 'cultural'
  travel_style            text[],
  preferred_climates      text[],
  budget_range            text,           -- 'budget' | 'mid-range' | 'luxury'
  group_size_preference   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. SAVED TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_trips (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  destination text,
  start_date  date,
  end_date    date,
  trip_data   jsonb,          -- full AI-generated trip plan
  notes       text,
  is_favorite boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 5. TRIP HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trip_history (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination text,
  visited_at  date,
  rating      int         CHECK (rating BETWEEN 1 AND 5),
  review      text,
  photos_urls text[],
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 6. USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_airlines      text[],
  preferred_hotel_chains  text[],
  dietary_restrictions    text[],
  accessibility_needs     text[],
  notification_email      boolean     NOT NULL DEFAULT true,
  notification_deals      boolean     NOT NULL DEFAULT true,
  currency                text        NOT NULL DEFAULT 'USD',
  language                text        NOT NULL DEFAULT 'en',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
--    Trigger fires on every INSERT into auth.users.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles: delete own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);


-- ── travel_personas ────────────────────────────────────────
ALTER TABLE public.travel_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "travel_personas: select own"
  ON public.travel_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "travel_personas: insert own"
  ON public.travel_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "travel_personas: update own"
  ON public.travel_personas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "travel_personas: delete own"
  ON public.travel_personas FOR DELETE
  USING (auth.uid() = user_id);


-- ── saved_trips ────────────────────────────────────────────
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_trips: select own"
  ON public.saved_trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_trips: insert own"
  ON public.saved_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_trips: update own"
  ON public.saved_trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "saved_trips: delete own"
  ON public.saved_trips FOR DELETE
  USING (auth.uid() = user_id);


-- ── trip_history ───────────────────────────────────────────
ALTER TABLE public.trip_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_history: select own"
  ON public.trip_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trip_history: insert own"
  ON public.trip_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trip_history: update own"
  ON public.trip_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "trip_history: delete own"
  ON public.trip_history FOR DELETE
  USING (auth.uid() = user_id);


-- ── user_preferences ──────────────────────────────────────
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences: select own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences: insert own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences: update own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences: delete own"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);
