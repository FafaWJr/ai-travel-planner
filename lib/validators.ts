import { z } from 'zod';

const tripStyleEnum = z.enum([
  'cultural-history',
  'gastronomy-food',
  'party-nightlife',
  'shopping',
  'family-friendly',
  'adventure-outdoors',
  'beach-relaxation',
  'wellness-spa',
  'romance-couples',
  'nature-eco',
  'sports-activities',
  'photography-art',
]);

const budgetLevelEnum = z.enum(['budget', 'mid-range', 'premium']);

export const tripFormSchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  startDate: z.string().min(1, 'Start date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    'Start date must be a valid date'
  ),
  endDate: z.string().min(1, 'End date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    'End date must be a valid date'
  ),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  adults: z.number().min(1, 'At least 1 adult required').max(20, 'Maximum 20 adults'),
  adultAges: z.array(z.string()).optional(),
  children: z.number().min(0, 'Children cannot be negative').max(20, 'Maximum 20 children'),
  childrenAges: z.array(z.string()).optional(),
  tripStyles: z.array(tripStyleEnum).min(1, 'Select at least one trip style'),
  budgetLevel: budgetLevelEnum,
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type TripFormSchema = z.infer<typeof tripFormSchema>;
