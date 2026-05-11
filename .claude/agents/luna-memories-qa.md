---
name: luna-memories-qa
description: "QA agent for the Luna Memories feature. Run after each memories phase ships to verify all deliverables, test every user entry path, check photo upload and EXIF sorting, validate AI narrative quality, test PDF output, confirm share links render for unauthenticated viewers, and verify zero regressions on existing planner/chat/collab features. Tests at 375px, 768px, and 1280px viewports. Reports pass/fail per check."
---

# Luna Memories QA Agent

Run this agent after each Memories phase implementation to verify the phase deliverables and confirm no regressions.

## Pre-run checklist

1. Read `docs/specs/memories/session_anchor.md` to identify the active phase and its deliverables.
2. Read `CURRENT_STATUS.md` to confirm the active phase matches what was just implemented.

## Phase-specific checks

### Phase 1: Memory mode on existing trips

1. **My Trips CTA change:**
   - Create a trip with an end date in the past.
   - Open /my-trips.
   - Confirm the trip card shows "Capture memories" as primary CTA.
   - Confirm "View trip" remains accessible as secondary action.

2. **Memory capture page:**
   - Click "Capture memories" on a past trip.
   - Confirm the memory page loads at /memories/[tripId].
   - Confirm day cards are pre-populated from the itinerary structure.
   - Confirm each day card has: notes field, mood selector, highlight toggle.
   - Type a note in Day 1, blur the field. Refresh the page. Confirm the note persisted.
   - Select a mood on Day 2. Refresh. Confirm it persisted.
   - Mark Day 3 as highlight. Confirm only one highlight is active at a time.

3. **AI narrative generation:**
   - Add notes to at least 3 days.
   - Click "Generate my story."
   - Confirm the AI narrative streams in (SSE, same as Luna chat).
   - Confirm the narrative references real place names from the itinerary.
   - Confirm the narrative is in first person, warm tone.
   - Click "Try a different version." Confirm a new narrative generates.
   - Edit a sentence in the narrative. Blur. Confirm edits persist.

4. **Shareable link:**
   - Click "Share your story."
   - Copy the share URL.
   - Open the URL in an incognito window (no auth).
   - Confirm the trip story renders: title, dates, narrative, branding.
   - Confirm the OG meta tags are present (check page source).

5. **Locale check:**
   - Switch to PT-BR. Repeat steps 1-2. Confirm all strings show correct PT-BR with accents.
   - Switch to ES. Confirm all strings show correct ES.
   - Confirm the AI narrative generates in the active locale.

### Phase 3: Photo upload + EXIF (when active)

6. **Photo upload:**
   - Select 10+ photos with EXIF data from a real trip.
   - Confirm EXIF dates are extracted and photos are auto-sorted to the correct day.
   - Confirm photos without EXIF appear in the "Unsorted" section.
   - Drag a photo from Unsorted to Day 2. Confirm it moves.
   - Delete a photo. Confirm deletion with confirmation dialog.

7. **Map:**
   - Confirm the route map appears if photos have GPS data.
   - Confirm pins are placed at photo locations.
   - Confirm day labels appear on pin clusters.

### Phase 6: PDF export (when active)

8. **PDF preview:**
   - On a completed memory, click "Download PDF."
   - Confirm a 2-page preview renders (cover + overview).
   - Confirm the cover shows: destination photo, trip title, dates, branding.

9. **Payment:**
   - Click "Download for $10."
   - Confirm Stripe Checkout opens.
   - Complete a test payment.
   - Confirm the PDF downloads after payment.
   - Confirm the PDF contains: cover, stats, day-by-day narrative, photos, reflections page.

## Regression checks (run on EVERY phase)

10. **Trip planner:**
    - Open /start. Complete the quiz. Generate a new trip.
    - Confirm the itinerary renders correctly with day cards, activities, photos.
    - Confirm Luna chat opens and responds.

11. **Luna chat mutations:**
    - In Luna chat: "Add a sunset dinner to day 2 evening."
    - Confirm the activity appears in the itinerary.
    - Confirm the tool_use block fires (not just text confirmation).

12. **Collaborative trips (if COLLAB flag is on):**
    - Open a trip. Click Share. Generate an invite link.
    - Confirm the invite modal opens and the link copies.

13. **Mobile responsive:**
    - Test the memory capture page at 375px.
    - Confirm day cards stack vertically.
    - Confirm notes fields are usable on mobile keyboard.
    - Confirm photo grid is touch-friendly.

14. **Build verification:**
    - Check Vercel build logs for the latest deployment.
    - Confirm no new warnings or errors related to memories files.
    - Confirm bundle size did not increase by more than 50KB (excluding photo libraries).

## Output

After all checks, produce a report:

```
Luna Memories QA Report
Phase: [N] - [name]
Date: [date]

PASSED:
- [list of passed checks with numbers]

FAILED:
- [list of failed checks with description of failure]

REGRESSIONS:
- None / [list any regression found]

RECOMMENDATION: Ship / Fix before shipping / Block
```
