'use client';

import type { BudgetLevel } from '@/types';

interface BudgetOption {
  value: BudgetLevel;
  emoji: string;
  title: string;
  description: string;
}

const BUDGET_OPTIONS: BudgetOption[] = [
  {
    value: 'budget',
    emoji: '💰',
    title: 'Budget Friendly',
    description: 'Hostels, street food, free attractions',
  },
  {
    value: 'mid-range',
    emoji: '🏨',
    title: 'Mid Range',
    description: '3-star hotels, casual dining, paid experiences',
  },
  {
    value: 'premium',
    emoji: '💎',
    title: 'Premium & Luxury',
    description: '5-star hotels, fine dining, exclusive experiences',
  },
];

interface BudgetSelectorProps {
  value: BudgetLevel;
  onChange: (budget: BudgetLevel) => void;
}

export function BudgetSelector({ value, onChange }: BudgetSelectorProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      role="radiogroup"
      aria-label="Budget level selection"
    >
      {BUDGET_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${option.title}: ${option.description}`}
            onClick={() => onChange(option.value)}
            className={`
              flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer text-center transition-all duration-200
              ${isSelected
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 dark:border-sky-400 shadow-lg shadow-sky-100 dark:shadow-sky-900'
                : 'border-border bg-card hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/30'
              }
            `}
          >
            <span className="text-3xl" role="img" aria-hidden="true">
              {option.emoji}
            </span>
            <div>
              <p className={`font-semibold text-sm ${
                isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-foreground'
              }`}>
                {option.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {option.description}
              </p>
            </div>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
