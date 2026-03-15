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
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => toggle(style.value)}
            aria-pressed={isSelected}
            aria-label={`${style.label} travel style`}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center cursor-pointer transition-all duration-200
              ${isSelected
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 dark:border-sky-400 shadow-md shadow-sky-100 dark:shadow-sky-900'
                : 'border-border bg-card hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/30'
              }
            `}
          >
            <span className="text-2xl" role="img" aria-hidden="true">
              {style.emoji}
            </span>
            <span className={`text-xs font-medium leading-tight ${
              isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground'
            }`}>
              {style.label}
            </span>
            {isSelected && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
