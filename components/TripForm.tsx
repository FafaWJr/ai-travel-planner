'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { tripFormSchema } from '@/lib/validators';
import type { TripFormData, TripStyle, BudgetLevel } from '@/types';
import { TripStyleSelector } from './TripStyleSelector';
import { BudgetSelector } from './BudgetSelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
}

function SectionHeader({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-3 mb-6`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm ${color}`}>
        {emoji}
      </div>
      <h3 className="text-lg font-bold text-foreground">{label}</h3>
    </div>
  );
}

function FormSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function TripForm({ onSubmit, isLoading }: TripFormProps) {
  const [adultAgeInputs, setAdultAgeInputs] = useState<string[]>([]);
  const [childAgeInputs, setChildAgeInputs] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      tripStyles: [],
      budgetLevel: 'mid-range',
      adultAges: [],
      childrenAges: [],
    },
  });

  const adultsCount = watch('adults');
  const childrenCount = watch('children');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const tripDays = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleAdultsChange = (val: number) => {
    const clamped = Math.max(1, Math.min(20, val));
    setValue('adults', clamped);
    const newAges = Array(clamped).fill('').map((_, i) => adultAgeInputs[i] || '');
    setAdultAgeInputs(newAges);
    setValue('adultAges', newAges);
  };

  const handleChildrenChange = (val: number) => {
    const clamped = Math.max(0, Math.min(20, val));
    setValue('children', clamped);
    const newAges = Array(clamped).fill('').map((_, i) => childAgeInputs[i] || '');
    setChildAgeInputs(newAges);
    setValue('childrenAges', newAges);
  };

  const updateAdultAge = (index: number, age: string) => {
    const updated = [...adultAgeInputs];
    updated[index] = age;
    setAdultAgeInputs(updated);
    setValue('adultAges', updated);
  };

  const updateChildAge = (index: number, age: string) => {
    const updated = [...childAgeInputs];
    updated[index] = age;
    setChildAgeInputs(updated);
    setValue('childrenAges', updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

      {/* Where & When */}
      <FormSection>
        <SectionHeader emoji="🌍" label="Where & When" color="bg-sky-100 dark:bg-sky-900/50" />

        {/* Destination */}
        <div className="space-y-2 mb-5">
          <label htmlFor="destination" className="text-sm font-semibold text-foreground">
            Where are you headed? <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none" aria-hidden="true">📍</span>
            <Input
              id="destination"
              {...register('destination')}
              placeholder="Paris, France · Tokyo, Japan · Bali, Indonesia…"
              className="pl-11 text-base h-13 rounded-xl border-2 focus:border-sky-400 bg-background"
              aria-describedby={errors.destination ? 'destination-error' : undefined}
              aria-required="true"
            />
          </div>
          {errors.destination && (
            <p id="destination-error" role="alert" className="text-sm text-destructive">
              {errors.destination.message}
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span aria-hidden="true">🛬</span> Arrival Date <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
              className="h-11 rounded-xl border-2 focus:border-sky-400"
              aria-describedby={errors.startDate ? 'startDate-error' : undefined}
              aria-required="true"
            />
            {errors.startDate && (
              <p id="startDate-error" role="alert" className="text-sm text-destructive">
                {errors.startDate.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span aria-hidden="true">🛫</span> Departure Date <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="h-11 rounded-xl border-2 focus:border-sky-400"
              aria-describedby={errors.endDate ? 'endDate-error' : undefined}
              aria-required="true"
            />
            {errors.endDate && (
              <p id="endDate-error" role="alert" className="text-sm text-destructive">
                {errors.endDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Trip duration badge */}
        {tripDays !== null && tripDays > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-full px-3.5 py-1.5 text-sm font-semibold text-sky-700 dark:text-sky-300">
            <span aria-hidden="true">🗓️</span>
            {tripDays} {tripDays === 1 ? 'night' : 'nights'} · {tripDays + 1} days
          </div>
        )}

        {/* Times (optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div className="space-y-2">
            <label htmlFor="arrivalTime" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <span aria-hidden="true">⏰</span> Arrival Time
              <span className="text-xs font-normal">(optional)</span>
            </label>
            <Input
              id="arrivalTime"
              type="time"
              {...register('arrivalTime')}
              className="h-10 rounded-xl border-2 focus:border-sky-400"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="departureTime" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <span aria-hidden="true">⏰</span> Departure Time
              <span className="text-xs font-normal">(optional)</span>
            </label>
            <Input
              id="departureTime"
              type="time"
              {...register('departureTime')}
              className="h-10 rounded-xl border-2 focus:border-sky-400"
            />
          </div>
        </div>
      </FormSection>

      {/* Who's Travelling */}
      <FormSection>
        <SectionHeader emoji="👥" label="Who's Travelling?" color="bg-violet-100 dark:bg-violet-900/50" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Adults */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Adults <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease adults"
                  onClick={() => handleAdultsChange(adultsCount - 1)}
                  className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xl font-bold transition-colors border-2 border-sky-200 dark:border-sky-700"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-foreground w-8 text-center tabular-nums" aria-live="polite">
                  {adultsCount}
                </span>
                <button
                  type="button"
                  aria-label="Increase adults"
                  onClick={() => handleAdultsChange(adultsCount + 1)}
                  className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xl font-bold transition-colors border-2 border-sky-200 dark:border-sky-700"
                >
                  +
                </button>
              </div>
              {errors.adults && (
                <p role="alert" className="text-sm text-destructive">{errors.adults.message}</p>
              )}
            </div>
            {adultsCount > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Ages (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: adultsCount }).map((_, i) => (
                    <div key={i}>
                      <label htmlFor={`adult-age-${i}`} className="sr-only">Adult {i + 1} age</label>
                      <Input
                        id={`adult-age-${i}`}
                        type="number"
                        placeholder={`Adult ${i + 1}`}
                        value={adultAgeInputs[i] || ''}
                        onChange={(e) => updateAdultAge(i, e.target.value)}
                        className="w-22 text-center text-xs h-8 rounded-lg"
                        min={18}
                        max={120}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Children */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Children</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease children"
                  onClick={() => handleChildrenChange(childrenCount - 1)}
                  className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xl font-bold transition-colors border-2 border-violet-200 dark:border-violet-700"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-foreground w-8 text-center tabular-nums" aria-live="polite">
                  {childrenCount}
                </span>
                <button
                  type="button"
                  aria-label="Increase children"
                  onClick={() => handleChildrenChange(childrenCount + 1)}
                  className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xl font-bold transition-colors border-2 border-violet-200 dark:border-violet-700"
                >
                  +
                </button>
              </div>
              {errors.children && (
                <p role="alert" className="text-sm text-destructive">{errors.children.message}</p>
              )}
            </div>
            {childrenCount > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Ages (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: childrenCount }).map((_, i) => (
                    <div key={i}>
                      <label htmlFor={`child-age-${i}`} className="sr-only">Child {i + 1} age</label>
                      <Input
                        id={`child-age-${i}`}
                        type="number"
                        placeholder={`Child ${i + 1}`}
                        value={childAgeInputs[i] || ''}
                        onChange={(e) => updateChildAge(i, e.target.value)}
                        className="w-22 text-center text-xs h-8 rounded-lg"
                        min={0}
                        max={17}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </FormSection>

      {/* Trip Style */}
      <FormSection>
        <SectionHeader emoji="✨" label="Trip Style" color="bg-amber-100 dark:bg-amber-900/50" />
        <p className="text-sm text-muted-foreground mb-5 -mt-2">
          Pick everything that excites you — your plan will be tailored to your interests.
        </p>
        <Controller
          name="tripStyles"
          control={control}
          render={({ field }) => (
            <TripStyleSelector
              value={field.value as TripStyle[]}
              onChange={field.onChange}
            />
          )}
        />
        {errors.tripStyles && (
          <p role="alert" className="text-sm text-destructive mt-3">{errors.tripStyles.message}</p>
        )}
      </FormSection>

      {/* Budget */}
      <FormSection>
        <SectionHeader emoji="💳" label="Budget Level" color="bg-emerald-100 dark:bg-emerald-900/50" />
        <Controller
          name="budgetLevel"
          control={control}
          render={({ field }) => (
            <BudgetSelector
              value={field.value as BudgetLevel}
              onChange={field.onChange}
            />
          )}
        />
        {errors.budgetLevel && (
          <p role="alert" className="text-sm text-destructive mt-3">{errors.budgetLevel.message}</p>
        )}
      </FormSection>

      {/* Special Requests */}
      <FormSection>
        <SectionHeader emoji="💬" label="Anything Special?" color="bg-rose-100 dark:bg-rose-900/50" />
        <label htmlFor="notes" className="sr-only">Special requests or notes</label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Dietary needs, mobility requirements, places you must visit, things to avoid, special occasions… tell us anything!"
          className="min-h-[110px] resize-none rounded-xl border-2 focus:border-sky-400 text-sm"
          aria-describedby={errors.notes ? 'notes-error' : 'notes-hint'}
        />
        <p id="notes-hint" className="text-xs text-muted-foreground mt-2">
          Optional — max 500 characters
        </p>
        {errors.notes && (
          <p id="notes-error" role="alert" className="text-sm text-destructive mt-1.5">{errors.notes.message}</p>
        )}
      </FormSection>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        aria-describedby={isLoading ? 'loading-status' : undefined}
        className="w-full h-16 rounded-2xl font-bold text-lg text-white transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed
          bg-gradient-to-r from-sky-500 via-sky-400 to-[#FF6B6B]
          hover:from-sky-600 hover:via-sky-500 hover:to-[#e05555]
          hover:shadow-xl hover:shadow-sky-200 dark:hover:shadow-sky-900
          active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Crafting Your Perfect Itinerary…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            <span aria-hidden="true">✈️</span>
            Generate My Travel Plan
            <span aria-hidden="true" className="text-white/80">→</span>
          </span>
        )}
      </button>
      {isLoading && (
        <p id="loading-status" role="status" className="sr-only">
          Generating your travel plan, please wait
        </p>
      )}
    </form>
  );
}
