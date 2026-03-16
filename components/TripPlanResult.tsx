'use client';

import { useMemo } from 'react';
import type { WeatherData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { WeatherWidget } from './WeatherWidget';
import { Button } from '@/components/ui/button';
import { PlaceHoverCard } from './PlaceHoverCard';

interface TripPlanResultProps {
  content: string;
  isStreaming: boolean;
  destination: string;
  weather: WeatherData | null;
}

interface Section {
  id: string;
  title: string;
  emoji: string;
  content: string;
}

const SECTION_DEFINITIONS = [
  { id: 'overview', title: 'Overview', emoji: '🌍', keywords: ['destination overview', 'overview'] },
  { id: 'weather', title: 'Weather', emoji: '🌤️', keywords: ['travel season', 'weather', 'season'] },
  { id: 'itinerary', title: 'Itinerary', emoji: '📅', keywords: ['itinerary', 'day-by-day', 'personalised itinerary'] },
  { id: 'stay', title: 'Stay', emoji: '🏨', keywords: ['where to stay', 'accommodation', 'stay'] },
  { id: 'transport', title: 'Transport', emoji: '🚌', keywords: ['getting around', 'transport', 'transportation'] },
  { id: 'budget', title: 'Budget', emoji: '💰', keywords: ['budget', 'budget estimator', 'costs'] },
  { id: 'tips', title: 'Tips', emoji: '💡', keywords: ['practical tips', 'tips'] },
];

function parseSections(content: string): Section[] {
  if (!content.trim()) return [];

  // Split on ## headers
  const parts = content.split(/(?=^## )/m);
  const sections: Section[] = [];

  for (const part of parts) {
    const lines = part.split('\n');
    const headerLine = lines[0] || '';
    if (!headerLine.startsWith('## ')) continue;

    const headerText = headerLine.replace(/^## /, '').trim().toLowerCase();
    const sectionContent = lines.slice(1).join('\n').trim();

    const match = SECTION_DEFINITIONS.find(def =>
      def.keywords.some(kw => headerText.includes(kw))
    );

    if (match) {
      const existingIndex = sections.findIndex(s => s.id === match.id);
      if (existingIndex === -1) {
        sections.push({
          id: match.id,
          title: match.title,
          emoji: match.emoji,
          content: sectionContent,
        });
      }
    }
  }

  // Ensure all sections exist (even if empty while streaming)
  return SECTION_DEFINITIONS.map(def => {
    const found = sections.find(s => s.id === def.id);
    return found || { id: def.id, title: def.title, emoji: def.emoji, content: '' };
  });
}

function renderMarkdown(text: string, hoverable = false): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${keyCounter++}`} className="list-none space-y-2.5 my-4 pl-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-3 text-base text-foreground leading-relaxed">
              <span className="text-sky-500 mt-1 shrink-0 text-lg" aria-hidden="true">•</span>
              <span>{renderInlineMarkdown(item, hoverable)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      flushList();
      // Day headers get a coloured pill style
      const text = line.slice(4);
      const isDayHeader = /^day\s+\d+/i.test(text.trim());
      elements.push(
        isDayHeader ? (
          <div key={`h3-${keyCounter++}`} className="flex items-center gap-3 mt-8 mb-3">
            <div className="flex-shrink-0 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {text.match(/^(Day\s+\d+)/i)?.[1] ?? 'Day'}
            </div>
            <h3 className="text-base font-bold text-foreground">
              {renderInlineMarkdown(text.replace(/^Day\s+\d+[:\s]*/i, ''))}
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>
        ) : (
          <h3 key={`h3-${keyCounter++}`} className="text-lg font-bold text-foreground mt-6 mb-2.5 border-l-4 border-sky-400 pl-3">
            {renderInlineMarkdown(text)}
          </h3>
        )
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${keyCounter++}`} className="text-xl font-bold text-foreground mt-7 mb-3">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      flushList();
      elements.push(
        <p key={`bold-${keyCounter++}`} className="text-base font-bold text-foreground mt-4 mb-1.5">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else if (line.match(/^\d+\. /)) {
      flushList();
      const num = line.match(/^(\d+)\. /)?.[1];
      const content = line.replace(/^\d+\. /, '');
      elements.push(
        <div key={`ol-${keyCounter++}`} className="flex items-start gap-3 text-base my-2 pl-1">
          <span className="font-bold text-sky-500 shrink-0 min-w-[24px] mt-0.5">{num}.</span>
          <span className="leading-relaxed">{renderInlineMarkdown(content, hoverable)}</span>
        </div>
      );
    } else if (line.trim() === '' || line.trim() === '---') {
      flushList();
      if (line.trim() === '---') {
        elements.push(<hr key={`hr-${keyCounter++}`} className="border-border my-5" />);
      } else {
        elements.push(<div key={`sp-${keyCounter++}`} className="h-2" />);
      }
    } else if (line.trim()) {
      flushList();
      elements.push(
        <p key={`p-${keyCounter++}`} className="text-base text-foreground leading-relaxed mb-2">
          {renderInlineMarkdown(line, hoverable)}
        </p>
      );
    }
  }

  flushList();
  return <>{elements}</>;
}

function renderInlineMarkdown(text: string, hoverable = false): React.ReactNode {
  if (!text) return null;
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const name = part.slice(2, -2);
          if (hoverable) return <PlaceHoverCard key={i} name={name} />;
          return <strong key={i} className="font-semibold">{name}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
}

export function TripPlanResult({ content, isStreaming, destination, weather }: TripPlanResultProps) {
  const sections = useMemo(() => parseSections(content), [content]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // ignore
    }
  };

  if (isStreaming && !content) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Generating travel plan">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
          <svg className="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-sky-700 dark:text-sky-300 font-medium">
            Crafting your personalised travel plan for <strong>{destination}</strong>...
          </p>
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className={`h-${4 + (i % 3)} w-${['full', '4/5', '3/4'][i % 3]}`} />
          ))}
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating...</span>
            </div>
          )}
        </div>
        {!isStreaming && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="text-xs gap-1.5"
              aria-label="Copy full plan to clipboard"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
              aria-label="Print travel plan"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl w-full">
          {sections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
            >
              <span aria-hidden="true">{section.emoji}</span>
              <span>{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-4">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 min-h-[200px]">
              {section.id === 'weather' && weather && (
                <div className="mb-5">
                  <WeatherWidget
                    weather={weather}
                    destination={destination}
                    isLoading={false}
                  />
                </div>
              )}
              {section.content ? (
                <div className="prose-like">
                  {renderMarkdown(
                    section.content,
                    ['itinerary', 'overview', 'stay'].includes(section.id)
                  )}
                </div>
              ) : isStreaming ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  This section is being generated...
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
