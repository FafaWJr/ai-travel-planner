'use client';

import type { BudgetLevel } from '@/types';

interface BudgetOption {
  value: BudgetLevel;
  emoji: string;
  title: string;
  description: string;
  range: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

const BUDGET_OPTIONS: BudgetOption[] = [
  {
    value: 'budget',
    emoji: '🎒',
    title: 'Budget Friendly',
    description: 'Hostels, street food & free sights',
    range: '< $80 / day',
    accent: 'bg-emerald-500',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-400 dark:border-emerald-600',
    accentText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'mid-range',
    emoji: '🏨',
    title: 'Mid Range',
    description: '3-star hotels, casual dining & experiences',
    range: '$80–$250 / day',
    accent: 'bg-sky-500',
    accentBg: 'bg-sky-50 dark:bg-sky-950/40',
    accentBorder: 'border-sky-400 dark:border-sky-600',
    accentText: 'text-sky-700 dark:text-sky-300',
  },
  {
    value: 'premium',
    emoji: '💎',
    title: 'Premium & Luxury',
    description: '5-star hotels, fine dining & exclusive tours',
    range: '$250+ / day',
    accent: 'bg-violet-500',
    accentBg: 'bg-violet-50 dark:bg-violet-950/40',
    accentBorder: 'border-violet-400 dark:border-violet-600',
    accentText: 'text-violet-700 dark:text-violet-300',
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
              relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer text-center transition-all duration-200
              ${isSelected
                ? `${option.accentBg} ${option.accentBorder} shadow-md`
                : 'border-border bg-card hover:border-border/80 hover:shadow-sm'
              }
            `}
          >
            {isSelected && (
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${option.accent} flex items-center justify-center`}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-4xl" role="img" aria-hidden="true">{option.emoji}</span>
            <div className="space-y-1">
              <p className={`font-bold text-sm ${isSelected ? option.accentText : 'text-foreground'}`}>
                {option.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
              <p className={`text-xs font-semibold mt-1 ${isSelected ? option.accentText : 'text-muted-foreground'}`}>
                {option.range}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
