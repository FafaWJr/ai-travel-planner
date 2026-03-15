'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { tripFormSchema } from '@/lib/validators';
import type { TripFormData, TripStyle, BudgetLevel } from '@/types';
import { TripStyleSelector } from './TripStyleSelector';
import { BudgetSelector } from './BudgetSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
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

  const handleFormSubmit = (data: TripFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-6">
      {/* Where & When */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">🌍</span> Where &amp; When
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Destination */}
          <div className="space-y-1.5">
            <label htmlFor="destination" className="text-sm font-medium">
              Destination <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="destination"
              {...register('destination')}
              placeholder="e.g. Paris, France or Tokyo, Japan"
              className="text-lg h-12"
              aria-describedby={errors.destination ? 'destination-error' : undefined}
              aria-required="true"
            />
            {errors.destination && (
              <p id="destination-error" role="alert" className="text-sm text-destructive">
                {errors.destination.message}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">
                Arrival Date <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                aria-required="true"
              />
              {errors.startDate && (
                <p id="startDate-error" role="alert" className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">
                Departure Date <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
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

          {/* Arrival / Departure Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="arrivalTime" className="text-sm font-medium text-muted-foreground">
                Arrival Time (optional)
              </label>
              <Input
                id="arrivalTime"
                type="time"
                {...register('arrivalTime')}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="departureTime" className="text-sm font-medium text-muted-foreground">
                Departure Time (optional)
              </label>
              <Input
                id="departureTime"
                type="time"
                {...register('departureTime')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Who's Travelling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">👥</span> Who&apos;s Travelling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Adults */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="adults" className="text-sm font-medium">
                  Adults <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease adults"
                    onClick={() => handleAdultsChange(adultsCount - 1)}
                    className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-lg font-medium transition-colors"
                  >
                    −
                  </button>
                  <Input
                    id="adults"
                    type="number"
                    min={1}
                    max={20}
                    {...register('adults', { valueAsNumber: true })}
                    onChange={(e) => handleAdultsChange(parseInt(e.target.value) || 1)}
                    className="text-center w-16"
                    aria-describedby={errors.adults ? 'adults-error' : undefined}
                    aria-required="true"
                  />
                  <button
                    type="button"
                    aria-label="Increase adults"
                    onClick={() => handleAdultsChange(adultsCount + 1)}
                    className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-lg font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
                {errors.adults && (
                  <p id="adults-error" role="alert" className="text-sm text-destructive">
                    {errors.adults.message}
                  </p>
                )}
              </div>

              {/* Adult age tags */}
              {adultsCount > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Adult ages (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: adultsCount }).map((_, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <label htmlFor={`adult-age-${i}`} className="sr-only">
                          Adult {i + 1} age
                        </label>
                        <Input
                          id={`adult-age-${i}`}
                          type="number"
                          placeholder={`Adult ${i + 1}`}
                          value={adultAgeInputs[i] || ''}
                          onChange={(e) => updateAdultAge(i, e.target.value)}
                          className="w-20 text-center text-xs h-7"
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
              <div className="space-y-1.5">
                <label htmlFor="children" className="text-sm font-medium">
                  Children
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease children"
                    onClick={() => handleChildrenChange(childrenCount - 1)}
                    className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-lg font-medium transition-colors"
                  >
                    −
                  </button>
                  <Input
                    id="children"
                    type="number"
                    min={0}
                    max={20}
                    {...register('children', { valueAsNumber: true })}
                    onChange={(e) => handleChildrenChange(parseInt(e.target.value) || 0)}
                    className="text-center w-16"
                    aria-describedby={errors.children ? 'children-error' : undefined}
                  />
                  <button
                    type="button"
                    aria-label="Increase children"
                    onClick={() => handleChildrenChange(childrenCount + 1)}
                    className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-lg font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
                {errors.children && (
                  <p id="children-error" role="alert" className="text-sm text-destructive">
                    {errors.children.message}
                  </p>
                )}
              </div>

              {/* Children age tags */}
              {childrenCount > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Children&apos;s ages (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: childrenCount }).map((_, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <label htmlFor={`child-age-${i}`} className="sr-only">
                          Child {i + 1} age
                        </label>
                        <Input
                          id={`child-age-${i}`}
                          type="number"
                          placeholder={`Child ${i + 1}`}
                          value={childAgeInputs[i] || ''}
                          onChange={(e) => updateChildAge(i, e.target.value)}
                          className="w-20 text-center text-xs h-7"
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
        </CardContent>
      </Card>

      {/* Trip Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">✨</span> Trip Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select all that apply — your plan will be tailored to your interests
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
            <p role="alert" className="text-sm text-destructive mt-3">
              {errors.tripStyles.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">💳</span> Budget Level
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <p role="alert" className="text-sm text-destructive mt-3">
              {errors.budgetLevel.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">📝</span> Special Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="notes" className="sr-only">
            Special requests or notes
          </label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Any special requirements, interests, dietary restrictions, mobility considerations, or specific places you want to visit..."
            className="min-h-[100px] resize-none"
            aria-describedby={errors.notes ? 'notes-error' : 'notes-hint'}
          />
          <p id="notes-hint" className="text-xs text-muted-foreground mt-1.5">
            Optional — max 500 characters
          </p>
          {errors.notes && (
            <p id="notes-error" role="alert" className="text-sm text-destructive mt-1.5">
              {errors.notes.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full h-14 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all duration-200 disabled:opacity-70"
        aria-describedby={isLoading ? 'loading-status' : undefined}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating Your Travel Plan...
          </>
        ) : (
          'Generate My Travel Plan →'
        )}
      </Button>
      {isLoading && (
        <p id="loading-status" role="status" className="sr-only">
          Generating your travel plan, please wait
        </p>
      )}
    </form>
  );
}
