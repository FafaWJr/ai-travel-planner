import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/lib/weather';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const destination = searchParams.get('destination');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!destination || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: destination, startDate, endDate' },
      { status: 400 }
    );
  }

  try {
    const weather = await getWeather(destination, startDate, endDate);
    return NextResponse.json({ weather });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
