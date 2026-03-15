'use client';

import type { WeatherData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  destination: string;
  isLoading: boolean;
}

export function WeatherWidget({ weather, destination, isLoading }: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3" aria-busy="true" aria-label="Loading weather data">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 dark:border-sky-800 p-4 space-y-3"
      aria-label={`Weather information for ${destination}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
          <span aria-hidden="true">🌤️</span>
          Weather for {destination}
        </h3>
        <Badge
          variant={weather.isForecast ? 'default' : 'secondary'}
          className={weather.isForecast
            ? 'bg-sky-500 text-white border-sky-500 text-xs'
            : 'text-xs'
          }
        >
          {weather.isForecast ? '14-Day Forecast' : 'Climate Average'}
        </Badge>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-sky-700 dark:text-sky-300" aria-label={`Average temperature ${weather.temperature.avg} degrees`}>
          {weather.temperature.avg}°C
        </span>
        <span className="text-sm text-muted-foreground">
          ({weather.temperature.min}° – {weather.temperature.max}°)
        </span>
      </div>

      <p className="text-sm text-sky-800 dark:text-sky-300 font-medium">
        {weather.description}
      </p>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden="true">🌧️</span>
        <span>Rainfall: {weather.rainfall}</span>
      </div>

      {weather.humidity !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true">💧</span>
          <span>Humidity: {weather.humidity}%</span>
        </div>
      )}
    </div>
  );
}
