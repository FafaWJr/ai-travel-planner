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
