'use client';

import { motion } from 'framer-motion';
import type { TripStyle } from '@/types';

interface TripStyleOption {
  value: TripStyle;
  emoji: string;
  label: string;
}

const TRIP_STYLES: TripStyleOption[] = [
  { value: 'cultural-history', emoji: '🏛️', label: 'Cultural & History' },
  { value: 'gastronomy-food', emoji: '🍽️', label: 'Gastronomy & Food' },
  { value: 'party-nightlife', emoji: '🎉', label: 'Party & Nightlife' },
  { value: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { value: 'family-friendly', emoji: '👨‍👩‍👧', label: 'Family Friendly' },
  { value: 'adventure-outdoors', emoji: '🏔️', label: 'Adventure & Outdoors' },
  { value: 'beach-relaxation', emoji: '🏖️', label: 'Beach & Relaxation' },
  { value: 'wellness-spa', emoji: '🧘', label: 'Wellness & Spa' },
  { value: 'romance-couples', emoji: '💑', label: 'Romance & Couples' },
  { value: 'nature-eco', emoji: '🌿', label: 'Nature & Eco' },
  { value: 'sports-activities', emoji: '⚽', label: 'Sports & Activities' },
  { value: 'photography-art', emoji: '📸', label: 'Photography & Art' },
];

interface TripStyleSelectorProps {
  value: TripStyle[];
  onChange: (styles: TripStyle[]) => void;
}

export function TripStyleSelector({ value, onChange }: TripStyleSelectorProps) {
  const toggle = (style: TripStyle) => {
    if (value.includes(style)) {
      onChange(value.filter(s => s !== style));
    } else {
      onChange([...value, style]);
    }
  };

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      role="group"
      aria-label="Trip style selection"
    >
      {TRIP_STYLES.map((style) => {
        const isSelected = value.includes(style.value);
        return (
          <motion.button
            key={style.value}
            type="button"
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => toggle(style.value)}
            aria-pressed={isSelected}
            aria-label={`${style.label} travel style`}
            className={`
              relative flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 text-center cursor-pointer transition-all duration-200
              ${isSelected
                ? 'border-sky-400 bg-gradient-to-b from-sky-50 to-sky-100/60 dark:from-sky-950 dark:to-sky-900/60 shadow-md shadow-sky-100/80 dark:shadow-sky-900/50'
                : 'border-border bg-card hover:border-sky-200 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 hover:shadow-sm'
              }
            `}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center" aria-hidden="true">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <span className="text-2xl" role="img" aria-hidden="true">{style.emoji}</span>
            <span className={`text-xs font-semibold leading-tight ${
              isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground'
            }`}>
              {style.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
