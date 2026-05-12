import type { PhotoMeta } from './types';

interface PdfDay {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
  photos: PhotoMeta[];
}

export interface PdfInput {
  destination: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  days: PdfDay[];
  narrative: string;
  supabaseUrl: string;
}

const MOOD_LABELS: Record<string, string> = {
  exhausted: 'Exhausted',
  content: 'Content',
  excited: 'Excited',
  peaceful: 'Peaceful',
  emotional: 'Emotional',
};

function getPhotoUrl(supabaseUrl: string, photo: PhotoMeta): string {
  return `${supabaseUrl}/storage/v1/object/public/memory-photos/${photo.storagePath}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Split the narrative into per-day sections.
 * Heuristic: match paragraphs to days by title words or "Day N" references.
 * Falls back to even distribution when matching fails.
 */
function splitNarrativeByDay(narrative: string, days: PdfDay[]): Record<number, string> {
  const paragraphs = narrative.split('\n\n').filter(p => p.trim());
  const result: Record<number, string> = {};

  if (paragraphs.length === 0) return result;

  const assigned = new Set<number>();

  for (const day of days) {
    const titleWords = day.dayTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchingIdxs: number[] = [];

    paragraphs.forEach((p, i) => {
      if (assigned.has(i)) return;
      const lower = p.toLowerCase();
      const matches = titleWords.some(w => lower.includes(w)) ||
        lower.includes(`day ${day.dayNumber}`) ||
        lower.includes(`day${day.dayNumber}`);
      if (matches) matchingIdxs.push(i);
    });

    if (matchingIdxs.length > 0) {
      result[day.dayNumber] = matchingIdxs.map(i => paragraphs[i]).join('\n\n');
      matchingIdxs.forEach(i => assigned.add(i));
    }
  }

  // Fallback: distribute unassigned paragraphs evenly across days
  if (Object.keys(result).length === 0 && days.length > 0) {
    const perDay = Math.ceil(paragraphs.length / days.length);
    days.forEach((day, i) => {
      const chunk = paragraphs.slice(i * perDay, (i + 1) * perDay);
      if (chunk.length > 0) result[day.dayNumber] = chunk.join('\n\n');
    });
  }

  return result;
}

export function buildPdfHtml(input: PdfInput): string {
  const { destination, startDate, endDate, days, narrative, supabaseUrl } = input;

  const narrativeByDay = splitNarrativeByDay(narrative, days);
  const totalDays = days.length;
  const highlightDay = days.find(d => d.highlight);
  const totalPhotos = days.reduce((sum, d) => sum + (d.photos?.length ?? 0), 0);

  const allParagraphs = narrative.split('\n\n').filter(p => p.trim());
  const intro = allParagraphs[0] ?? '';
  const outro = allParagraphs.length > 2 ? allParagraphs[allParagraphs.length - 1] : '';

  const daySectionsHtml = days.map(day => {
    const dayNarrative = narrativeByDay[day.dayNumber] ?? '';
    const dayPhotos = (day.photos ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const moodLabel = day.mood ? (MOOD_LABELS[day.mood] ?? day.mood) : '';

    let photosHtml = '';
    if (dayPhotos.length === 1) {
      photosHtml = `
        <div class="photo-hero">
          <img src="${getPhotoUrl(supabaseUrl, dayPhotos[0])}" alt="Day ${day.dayNumber}" />
        </div>`;
    } else if (dayPhotos.length >= 2) {
      const hero = dayPhotos[0];
      const grid = dayPhotos.slice(1, 4);
      photosHtml = `
        <div class="photo-hero">
          <img src="${getPhotoUrl(supabaseUrl, hero)}" alt="Day ${day.dayNumber}" />
        </div>
        <div class="photo-grid">
          ${grid.map(p => `<img src="${getPhotoUrl(supabaseUrl, p)}" alt="Day ${day.dayNumber}" />`).join('\n          ')}
        </div>`;
    }

    const pullQuote = day.notes && day.notes.length > 20
      ? `<blockquote class="pull-quote">${escapeHtml(day.notes.length > 200 ? day.notes.slice(0, 197) + '...' : day.notes)}</blockquote>`
      : '';

    return `
      <div class="day-section${day.highlight ? ' highlight-day' : ''}">
        <div class="day-header">
          <span class="day-badge">${day.dayNumber}</span>
          <div class="day-meta">
            <h2 class="day-title">${escapeHtml(day.dayTitle)}</h2>
            ${moodLabel ? `<span class="day-mood">${moodLabel}</span>` : ''}
          </div>
        </div>
        ${photosHtml}
        ${dayNarrative ? `<div class="day-narrative">${escapeHtml(dayNarrative).replace(/\n/g, '<br/>')}</div>` : ''}
        ${pullQuote}
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }

    @page {
      @bottom-center {
        content: counter(page);
        font-size: 10px;
        color: #C0C0C0;
      }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      color: #2a2a3e;
      line-height: 1.85;
      background: #FDFBF7;
    }

    /* Cover */
    .cover {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 60px 48px;
      background: linear-gradient(180deg, #001F3F 0%, #00447B 60%, #003060 100%);
      color: #fff;
    }

    .cover-badge {
      display: inline-block;
      background: rgba(255,130,16,0.2);
      border: 1px solid rgba(255,130,16,0.4);
      border-radius: 100px;
      padding: 6px 18px;
      font-size: 11px;
      font-weight: 600;
      color: #FFBD59;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 20px;
    }

    .cover-title {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 16px;
      max-width: 80%;
    }

    .cover-dates {
      font-size: 16px;
      color: rgba(255,255,255,0.55);
      margin-bottom: 40px;
    }

    .cover-branding {
      font-size: 13px;
      color: rgba(255,255,255,0.3);
    }

    /* Overview */
    .overview {
      page-break-after: always;
      padding: 48px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-item { text-align: center; }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #00447B;
    }

    .stat-label {
      font-size: 12px;
      color: #6C6D6F;
      margin-top: 4px;
    }

    .overview-divider {
      width: 40px;
      height: 3px;
      background: #FF8210;
      margin: 32px auto;
      border-radius: 2px;
    }

    .overview-intro {
      font-size: 15px;
      line-height: 1.9;
      color: #2a2a3e;
      font-style: italic;
      max-width: 85%;
      margin: 0 auto;
      text-align: center;
    }

    /* Day sections */
    .day-section {
      page-break-inside: avoid;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(0,68,123,0.06);
    }

    .day-section:last-child { border-bottom: none; }

    .highlight-day {
      border-left: 4px solid #FF8210;
      padding-left: 20px;
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }

    .day-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #FF8210;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
    }

    .day-title {
      font-size: 20px;
      font-weight: 600;
      color: #00447B;
      line-height: 1.3;
    }

    .day-mood {
      font-size: 12px;
      color: #6C6D6F;
      margin-top: 2px;
    }

    .photo-hero {
      margin-bottom: 12px;
      border-radius: 8px;
      overflow: hidden;
    }

    .photo-hero img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 8px;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }

    .photo-grid img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 6px;
      display: block;
    }

    .day-narrative {
      font-size: 13px;
      line-height: 1.85;
      color: #2a2a3e;
      margin-top: 16px;
    }

    .pull-quote {
      border-left: 3px solid #FF8210;
      padding-left: 16px;
      margin: 20px 0;
      font-style: italic;
      font-size: 14px;
      color: #6C6D6F;
      line-height: 1.7;
    }

    /* Reflections */
    .reflections {
      page-break-before: always;
      padding: 48px 0;
      text-align: center;
    }

    .reflections-text {
      font-size: 15px;
      line-height: 1.9;
      color: #2a2a3e;
      font-style: italic;
      max-width: 85%;
      margin: 0 auto 40px;
    }

    .reflections-signoff {
      font-size: 16px;
      font-weight: 600;
      color: #00447B;
      margin-bottom: 32px;
    }

    .reflections-branding {
      font-size: 12px;
      color: #C0C0C0;
    }

    .reflections-branding a {
      color: #FF8210;
      text-decoration: none;
    }
  </style>
</head>
<body>

  <!-- Cover -->
  <div class="cover">
    <span class="cover-badge">Trip Memory</span>
    <h1 class="cover-title">${escapeHtml(destination)}</h1>
    <p class="cover-dates">${formatDate(startDate)}${startDate && endDate ? ' → ' : ''}${formatDate(endDate)}</p>
    <p class="cover-branding">Luna Let's Go &middot; lunaletsgo.com</p>
  </div>

  <!-- Overview -->
  <div class="overview">
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">${totalDays}</div>
        <div class="stat-label">${totalDays === 1 ? 'Day' : 'Days'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalPhotos}</div>
        <div class="stat-label">Photos</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${highlightDay ? `Day ${highlightDay.dayNumber}` : '-'}</div>
        <div class="stat-label">Best Moment</div>
      </div>
    </div>
    <div class="overview-divider"></div>
    ${intro ? `<p class="overview-intro">${escapeHtml(intro)}</p>` : ''}
  </div>

  <!-- Day-by-day sections -->
  ${daySectionsHtml}

  <!-- Reflections -->
  <div class="reflections">
    ${outro ? `<p class="reflections-text">${escapeHtml(outro)}</p>` : ''}
    <p class="reflections-signoff">Until the next adventure.</p>
    <p class="reflections-branding">
      Your trip, narrated by Luna<br/>
      <a href="https://lunaletsgo.com">lunaletsgo.com</a>
    </p>
  </div>

</body>
</html>`;
}
