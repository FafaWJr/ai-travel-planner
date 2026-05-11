# Luna Memories: Session Anchor (immutable during sessions)
# Last updated: May 2026 by orchestrator
# Location: docs/specs/memories/session_anchor.md
# Rule: Claude Code reads this at session start. Claude Code NEVER edits this file.

## Objective
Deliver a post-trip memory feature that captures, narrates, and exports trip memories
as premium products (shareable link, PDF, print book). First monetisation channel for Luna.

## Phases and deliverables

Phase 1: Memory mode on existing trips
  Delivers: trip_memories table, per-day notes UI, AI narrative API, My Trips CTA change, shareable link

Phase 2: Mid-trip capture banner
  Delivers: Plan page date-aware banner, quick day-note save, contextual prompt

Phase 3: Photo upload + EXIF auto-sort
  Delivers: memory-photos storage bucket, photo upload UI, EXIF date/GPS parsing, auto-day-sort, route map

Phase 4: /memories standalone page + nav
  Delivers: Public landing page, standalone trip creation, nav header item, SEO content

Phase 5: Social sharing cards
  Delivers: Branded 1080x1920 trip card image, Instagram URL scheme share, download to camera roll

Phase 6: PDF export (first monetisation)
  Delivers: Premium PDF generation, Stripe one-off payment, editorial template (cover/stats/narrative/photos)

Phase 7: PWA layer
  Delivers: Web app manifest, service worker, install prompt, mobile photo upload UX

Phase 8: Print book via Peecho
  Delivers: Peecho Print API integration, order flow, print-ready PDF layout

Phase 9: Re-engagement loop
  Delivers: Brevo email sequences (trip end, 30-day, anniversary), trip-end detection cron

## Explicitly out of scope
- Native mobile app (iOS/Android). Web + PWA only.
- GPS background tracking. EXIF-based retroactive approach only.
- Real-time camera roll scanning. Manual upload with EXIF assist only.
- Video upload or video reel generation. Photos and text only.
- Subscription model. One-off purchases only (PDF, print book).
- Social features (following, likes, community feed). Share links only.
- Booking.com or affiliate integration within memories.
- Modifications to Luna's existing trip planner, chat, generation, or collab systems.
- TikTok OpenSDK integration (evaluate post Phase 5).
- Cheap flight tracking, deal alerts, LGBTQ+ mode, disability mode, B2B white-label.

## Rules
- Hotfixes do not change phases. A hotfix only fixes implementation within the current active phase.
- No new feature creep during a phase. Log ideas in docs/specs/memories/ideas_backlog.md.
- Every phase passes its smoke tests before the next phase begins.
- Existing trip planner, Luna chat, collaborative trips, and all current features must work
  identically before and after every phase ships.
- All new UI: Poppins/Inter fonts, #FF8210/#00447B colours, Lucide icons only, no emoji, no em-dashes.
- All new user-facing strings ship in EN, PT-BR, and ES simultaneously.
- All new Supabase tables with user_id FK to profiles(id), NOT auth.users(id).
- Before any hotfix: record in docs/specs/memories/hotfix_log.md. Confirm active phase did not change.
