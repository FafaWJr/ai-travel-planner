'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface GeoResult {
  id: number;
  name: string;
  country: string;
  country_code: string;
  admin1?: string; // state/province
}

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  id?: string;
}

function formatResult(r: GeoResult): string {
  const parts = [r.name];
  if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1);
  parts.push(r.country);
  return parts.join(', ');
}

export function DestinationAutocomplete({
  value,
  onChange,
  onBlur,
  error,
  id = 'destination',
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFetchRef = useRef(false);

  // Sync external value → internal query when changed programmatically
  useEffect(() => {
    if (value !== query) setQuery(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`
      );
      const data = await res.json();
      const items: GeoResult[] = data.results ?? [];
      setResults(items);
      setIsOpen(items.length > 0);
      setActiveIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    skipFetchRef.current = false;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!skipFetchRef.current) fetchSuggestions(val);
    }, 280);
  };

  const selectResult = (r: GeoResult) => {
    const formatted = formatResult(r);
    skipFetchRef.current = true;
    setQuery(formatted);
    onChange(formatted);
    setIsOpen(false);
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none" aria-hidden="true">
          📍
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder="Paris, France · Tokyo, Japan · Bali, Indonesia…"
          aria-autocomplete="list"
          aria-controls={isOpen ? 'destination-listbox' : undefined}
          aria-activedescendant={activeIndex >= 0 ? `dest-option-${activeIndex}` : undefined}
          aria-describedby={error ? 'destination-error' : undefined}
          aria-required="true"
          className={`
            w-full pl-11 pr-10 text-base h-13 rounded-xl border-2 bg-background text-foreground
            placeholder:text-muted-foreground transition-colors
            focus:outline-none focus:border-sky-400
            ${error ? 'border-destructive' : 'border-input hover:border-sky-300'}
          `}
        />
        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
            <svg className="animate-spin h-4 w-4 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          id="destination-listbox"
          ref={listRef}
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute z-50 w-full mt-1.5 rounded-xl border border-border bg-popover shadow-xl overflow-hidden max-h-72 overflow-y-auto"
        >
          {results.map((r, i) => {
            const label = formatResult(r);
            const isActive = i === activeIndex;
            return (
              <li
                key={r.id}
                id={`dest-option-${i}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => { e.preventDefault(); selectResult(r); }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-sm
                  ${isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-foreground'
                    : 'text-foreground hover:bg-muted/60'
                  }
                  ${i !== 0 ? 'border-t border-border/50' : ''}
                `}
              >
                <span className="text-base shrink-0" aria-hidden="true">
                  {getFlagEmoji(r.country_code)}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold">{r.name}</span>
                  {(r.admin1 || r.country) && (
                    <span className="text-muted-foreground">
                      {r.admin1 && r.admin1 !== r.name ? `, ${r.admin1}` : ''}{r.country ? `, ${r.country}` : ''}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = [...countryCode.toUpperCase()].map(
    c => 0x1F1E6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}
