export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  arrivalTime?: string;
  departureTime?: string;
  adults: number;
  adultAges?: string[];
  children: number;
  childrenAges?: string[];
  tripStyles: TripStyle[];
  budgetLevel: BudgetLevel;
  notes?: string;
}

export type TripStyle =
  | 'cultural-history'
  | 'gastronomy-food'
  | 'party-nightlife'
  | 'shopping'
  | 'family-friendly'
  | 'adventure-outdoors'
  | 'beach-relaxation'
  | 'wellness-spa'
  | 'romance-couples'
  | 'nature-eco'
  | 'sports-activities'
  | 'photography-art';

export type BudgetLevel = 'budget' | 'mid-range' | 'premium';

export interface WeatherData {
  temperature: { min: number; max: number; avg: number };
  description: string;
  rainfall: string;
  humidity?: number;
  isForecast: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * A named phase of a multi-segment trip (used for 15+ day trips).
 * Phases group days into thematic segments (e.g. "Days 1-5: Coastal Escape").
 */
export interface Phase {
  id: string;
  label: string;
  dayFrom: number;
  dayTo: number;
  summary: string;
  highlights: string[];
  /** True once all define_day calls for this phase have been received */
  planned: boolean;
}

/**
 * Input schema for the define_phase Anthropic tool.
 * snake_case matches the Anthropic tool property convention.
 */
export interface DefinePhaseInput {
  phase_id: string;
  label: string;
  day_from: number;
  day_to: number;
  summary: string;
  highlights: string[];
}

/**
 * Input schema for the define_day Anthropic tool.
 * Each time slot holds an array of activity strings.
 */
export interface DefineDayInput {
  day: number;
  title: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  night: string[];
  /** Optional: which phase this day belongs to (set for 15+ day trips) */
  phase_id?: string;
}
