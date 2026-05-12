import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { AI_MODELS, AI_CONFIG, getLanguageInstruction } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { destination, numDays, locale } = await request.json() as {
      destination: string;
      numDays: number;
      locale?: string;
    };

    if (!destination || !numDays || numDays < 1) {
      return Response.json({ error: 'destination and numDays are required' }, { status: 400 });
    }

    const langInstruction = getLanguageInstruction(locale ?? 'en');

    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: AI_MODELS.primary,
      max_tokens: AI_CONFIG.maxTokens.skeleton,
      messages: [{
        role: 'user',
        content: `Generate exactly ${numDays} day titles for a trip to ${destination}. Each title should suggest a neighbourhood, area, or theme for that day, based on what a typical traveller would do.

Format: Return ONLY a JSON array of strings, no other text. Example for a 3-day Lisbon trip:
["Alfama and Baixa", "Belem and Riverside", "Sintra Day Trip"]

Rules:
- Exactly ${numDays} items in the array
- Each title is 2-6 words, a real area or activity theme
- No generic titles like "Exploring the city"
- No day numbers in the titles (the system adds "Day N:" automatically)
- Base the suggestions on real, well-known areas and attractions
${langInstruction ? `\n${langInstruction}` : ''}`,
      }],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    try {
      const titles = JSON.parse(text.replace(/```json|```/g, '').trim()) as string[];
      return Response.json({ titles });
    } catch {
      console.error('[skeleton] JSON parse failed:', text);
      const fallback = Array.from({ length: numDays }, (_, i) => `Day ${i + 1} in ${destination}`);
      return Response.json({ titles: fallback });
    }
  } catch (err) {
    console.error('[skeleton] error:', err);
    return Response.json({ error: 'Failed to generate day titles' }, { status: 500 });
  }
}
