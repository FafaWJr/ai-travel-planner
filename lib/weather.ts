import type { WeatherData } from '@/types';

function getClimateDescription(destination: string, startDate: string): WeatherData {
  const date = new Date(startDate);
  const month = date.getMonth(); // 0-11

  // Rough hemisphere detection based on common southern hemisphere destinations
  const southernHemisphereKeywords = [
    'australia', 'new zealand', 'argentina', 'chile', 'brazil', 'south africa',
    'peru', 'bolivia', 'uruguay', 'paraguay', 'sydney', 'melbourne', 'auckland',
    'buenos aires', 'santiago', 'cape town', 'johannesburg', 'lima'
  ];
  const isSouthernHemisphere = southernHemisphereKeywords.some(kw =>
    destination.toLowerCase().includes(kw)
  );

  // Adjust month for southern hemisphere (seasons are reversed)
  const effectiveMonth = isSouthernHemisphere ? (month + 6) % 12 : month;

  let description: string;
  let tempMin: number;
  let tempMax: number;
  let rainfall: string;

  if (effectiveMonth >= 2 && effectiveMonth <= 4) {
    // Spring
    description = 'Spring – mild and pleasant with occasional showers';
    tempMin = 10;
    tempMax = 20;
    rainfall = '50-80mm monthly average';
  } else if (effectiveMonth >= 5 && effectiveMonth <= 7) {
    // Summer
    description = 'Summer – warm and sunny with low rainfall';
    tempMin = 18;
    tempMax = 30;
    rainfall = '30-50mm monthly average';
  } else if (effectiveMonth >= 8 && effectiveMonth <= 10) {
    // Autumn
    description = 'Autumn – cooling temperatures with increasing rainfall';
    tempMin = 10;
    tempMax = 20;
    rainfall = '60-100mm monthly average';
  } else {
    // Winter
    description = 'Winter – cool to cold with higher chance of precipitation';
    tempMin = 2;
    tempMax = 10;
    rainfall = '70-120mm monthly average';
  }

  const avg = Math.round((tempMin + tempMax) / 2);

  return {
    temperature: { min: tempMin, max: tempMax, avg },
    description,
    rainfall,
    isForecast: false,
  };
}

export async function getWeather(
  destination: string,
  startDate: string,
  endDate: string
): Promise<WeatherData | null> {
  try {
    // Check if dates are within 14-day forecast window
    const today = new Date();
    const start = new Date(startDate);
    const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 14) {
      return getClimateDescription(destination, startDate);
    }

    // Geocoding: get lat/lng for destination
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`,
      { cache: 'no-store' }
    );

    if (!geoRes.ok) {
      return getClimateDescription(destination, startDate);
    }

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return getClimateDescription(destination, startDate);
    }

    const { latitude, longitude } = geoData.results[0];

    // Clamp dates to forecast range (max 14 days from today)
    const maxForecastDate = new Date(today);
    maxForecastDate.setDate(maxForecastDate.getDate() + 14);

    const clampedEndDate = new Date(endDate) > maxForecastDate
      ? maxForecastDate.toISOString().split('T')[0]
      : endDate;

    const clampedStartDate = new Date(startDate) < today
      ? today.toISOString().split('T')[0]
      : startDate;

    // Fetch weather forecast
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&start_date=${clampedStartDate}&end_date=${clampedEndDate}`,
      { cache: 'no-store' }
    );

    if (!weatherRes.ok) {
      return getClimateDescription(destination, startDate);
    }

    const weatherData = await weatherRes.json();

    if (!weatherData.daily || !weatherData.daily.temperature_2m_max) {
      return getClimateDescription(destination, startDate);
    }

    const temps_max: number[] = weatherData.daily.temperature_2m_max;
    const temps_min: number[] = weatherData.daily.temperature_2m_min;
    const precipitation: number[] = weatherData.daily.precipitation_sum || [];
    const weathercodes: number[] = weatherData.daily.weathercode || [];

    const avgMax = Math.round(temps_max.reduce((a, b) => a + (b || 0), 0) / temps_max.length);
    const avgMin = Math.round(temps_min.reduce((a, b) => a + (b || 0), 0) / temps_min.length);
    const avgTemp = Math.round((avgMax + avgMin) / 2);
    const totalRainfall = precipitation.reduce((a, b) => a + (b || 0), 0).toFixed(1);

    // Determine description from most common weather code
    const dominantCode = weathercodes.length > 0
      ? weathercodes.reduce((prev, curr) =>
          weathercodes.filter(c => c === curr).length > weathercodes.filter(c => c === prev).length ? curr : prev,
          weathercodes[0]
        )
      : 0;

    const description = getWeatherDescription(dominantCode);

    return {
      temperature: { min: avgMin, max: avgMax, avg: avgTemp },
      description,
      rainfall: `${totalRainfall}mm total for period`,
      isForecast: true,
    };
  } catch {
    try {
      return getClimateDescription(destination, startDate);
    } catch {
      return null;
    }
  }
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 9) return 'Foggy or hazy conditions';
  if (code <= 19) return 'Light drizzle';
  if (code <= 29) return 'Precipitation nearby';
  if (code <= 39) return 'Foggy';
  if (code <= 49) return 'Drizzle';
  if (code <= 59) return 'Rainy';
  if (code <= 69) return 'Snow or sleet';
  if (code <= 79) return 'Snow showers';
  if (code <= 84) return 'Showers';
  if (code <= 94) return 'Thunderstorms';
  return 'Severe weather';
}
