import type { TripFormData, TripStyle, BudgetLevel, WeatherData } from '@/types';

export const TRIP_STYLE_LABELS: Record<TripStyle, string> = {
  'cultural-history': 'Cultural & History',
  'gastronomy-food': 'Gastronomy & Food',
  'party-nightlife': 'Party & Nightlife',
  'shopping': 'Shopping',
  'family-friendly': 'Family Friendly',
  'adventure-outdoors': 'Adventure & Outdoors',
  'beach-relaxation': 'Beach & Relaxation',
  'wellness-spa': 'Wellness & Spa',
  'romance-couples': 'Romance & Couples',
  'nature-eco': 'Nature & Eco',
  'sports-activities': 'Sports & Activities',
  'photography-art': 'Photography & Art',
};

export const BUDGET_LABELS: Record<BudgetLevel, string> = {
  'budget': 'Budget Friendly',
  'mid-range': 'Mid Range',
  'premium': 'Premium & Luxury',
};

export function buildTravelPrompt(form: TripFormData, weather: WeatherData | null): string {
  const styleLabels = form.tripStyles.map(s => TRIP_STYLE_LABELS[s]).join(', ');
  const budgetLabel = BUDGET_LABELS[form.budgetLevel];

  const startDateFormatted = new Date(form.startDate).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const endDateFormatted = new Date(form.endDate).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const start = new Date(form.startDate);
  const end = new Date(form.endDate);
  const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let travellerInfo = `${form.adults} adult${form.adults !== 1 ? 's' : ''}`;
  if (form.adultAges && form.adultAges.length > 0) {
    travellerInfo += ` (ages: ${form.adultAges.filter(a => a).join(', ')})`;
  }
  if (form.children > 0) {
    travellerInfo += ` and ${form.children} child${form.children !== 1 ? 'ren' : ''}`;
    if (form.childrenAges && form.childrenAges.length > 0) {
      travellerInfo += ` (ages: ${form.childrenAges.filter(a => a).join(', ')})`;
    }
  }

  let weatherContext = '';
  if (weather) {
    weatherContext = `
## Weather Information
- Type: ${weather.isForecast ? '14-day forecast' : 'Climate average for this season'}
- Temperature: ${weather.temperature.min}°C – ${weather.temperature.max}°C (avg ${weather.temperature.avg}°C)
- Conditions: ${weather.description}
- Rainfall: ${weather.rainfall}
${weather.humidity !== undefined ? `- Humidity: ${weather.humidity}%` : ''}
`;
  }

  const userPrompt = `Please create a comprehensive travel plan for the following trip:

## Trip Details
- **Destination:** ${form.destination}
- **Travel Dates:** ${startDateFormatted} to ${endDateFormatted} (${tripDays} day${tripDays !== 1 ? 's' : ''})
${form.arrivalTime ? `- **Arrival Time:** ${form.arrivalTime}` : ''}
${form.departureTime ? `- **Departure Time:** ${form.departureTime}` : ''}

## Travellers
- ${travellerInfo}

## Trip Preferences
- **Travel Styles:** ${styleLabels}
- **Budget Level:** ${budgetLabel}
${form.notes ? `\n## Special Requests\n${form.notes}` : ''}
${weatherContext}

---

Please provide a detailed, personalised travel plan in Markdown format with exactly these 7 sections as H2 headers:

## Destination Overview
Provide a compelling overview of ${form.destination}: what makes it special, highlights, best areas to explore, and what type of traveller it suits.

## Travel Season & Weather
Describe what to expect weather-wise during the travel dates, what to pack, seasonal events or festivals, and any weather-related tips.

## Personalised Itinerary
Create a detailed day-by-day itinerary for all ${tripDays} days, tailored to the travellers' styles (${styleLabels}) and budget (${budgetLabel}).

IMPORTANT formatting rules for this section:
- Use "### Day N: Title" as the header for each day.
- Inside each day, include EXACTLY these four sub-headers in order: **Morning:**, **Afternoon:**, **Evening:**, **Night:**
- Under each sub-header, list at least one activity as a bullet point.
- Do NOT include the time-of-day word inside the bullet text itself — the sub-header already communicates that.
- Example structure:
  ### Day 1: Arrival & First Impressions
  **Morning:**
  - Check in to your hotel and freshen up
  **Afternoon:**
  - Explore the old town on foot
  **Evening:**
  - Dinner at a local restaurant
  **Night:**
  - Stroll along the waterfront

## Where to Stay
Recommend 3-5 specific accommodation options that match the ${budgetLabel} budget and the group's needs. Include neighbourhood, why it suits this group, and approximate price range per night.

## Getting Around
Cover airport transfers, local transport options, getting between attractions, and any transport passes or apps to download. Include estimated costs.

## Budget Estimator
Break down estimated total costs per person for: accommodation, food & dining, activities & entrance fees, transport, and extras. Provide a total range in both local currency and USD/EUR. Tailor to the ${budgetLabel} level.

## Practical Tips
Provide 8-10 specific tips for this destination covering: visa requirements, safety, cultural customs, must-try local dishes, best apps to download, language basics (if applicable), and any destination-specific advice.

Make the plan engaging, specific, and genuinely helpful. Use bullet points, bold text, and clear formatting throughout.`;

  return userPrompt;
}

export const SYSTEM_PROMPT = `You are an expert travel planner with deep knowledge of destinations worldwide. You create personalised, detailed, and genuinely helpful travel itineraries. Your plans are specific (not generic), practical, and tailored to the traveller's preferences and budget. You write in an engaging, friendly tone while remaining professional and informative. Always use Markdown formatting with clear headers, bullet points, and bold text for key information.`;
