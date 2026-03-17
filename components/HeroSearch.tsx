'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface GeoResult {
  id: number;
  name: string;
  country: string;
  country_code: string;
  admin1?: string;
}

interface HeroSearchProps {
  /** Called when user commits a destination (Enter, button click, or dropdown select) */
  onSubmit: (destination: string) => void;
}

function formatResult(r: GeoResult): string {
  const parts = [r.name];
  if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1);
  parts.push(r.country);
  return parts.join(', ');
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = [...countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export function HeroSearch({ onSubmit }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFetchRef = useRef(false);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`
      );
      const data = await res.json();
      const items: GeoResult[] = data.results ?? [];
      setResults(items);
      setThumbnails({});
      setIsOpen(items.length > 0);
      setActiveIndex(-1);

      // Fetch thumbnails in background
      Promise.allSettled(
        items.map(r =>
          fetch(`/api/place-photo?q=${encodeURIComponent(r.name)}`)
            .then(res => res.json())
            .then(d => ({ id: r.id, url: d.url as string | null }))
        )
      ).then(settled => {
        const map: Record<number, string> = {};
        settled.forEach(r => {
          if (r.status === 'fulfilled' && r.value.url) map[r.value.id] = r.value.url;
        });
        setThumbnails(map);
      });
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
    setIsOpen(false);
    setResults([]);
    setActiveIndex(-1);
    onSubmit(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && results.length > 0) { setIsOpen(true); return; }
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && isOpen) {
        selectResult(results[activeIndex]);
      } else {
        setIsOpen(false);
        onSubmit(query);
      }
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
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      {/* Pill input row */}
      <div className="flex items-center bg-white rounded-full shadow-2xl shadow-black/30 p-2">
        <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Where do you want to go?"
          aria-label="Destination"
          aria-autocomplete="list"
          aria-controls={isOpen ? 'hero-destination-listbox' : undefined}
          aria-activedescendant={activeIndex >= 0 ? `hero-dest-option-${activeIndex}` : undefined}
          className="flex-1 px-4 py-2.5 bg-transparent text-gray-900 text-base outline-none placeholder:text-gray-400 font-medium"
        />
        {/* Loading spinner */}
        {isLoading && (
          <div className="mr-2 shrink-0" aria-hidden="true">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={() => { setIsOpen(false); onSubmit(query); }}
          className="shrink-0 flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm text-white transition-colors bg-[#FF6B35] hover:bg-[#E55A25]"
          aria-label="Plan my trip"
        >
          Plan my trip
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          id="hero-destination-listbox"
          ref={listRef}
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute z-50 w-full mt-2 rounded-2xl bg-white shadow-2xl shadow-black/20 overflow-hidden max-h-72 overflow-y-auto border border-gray-100"
        >
          {results.map((r, i) => {
            const label = formatResult(r);
            const isActive = i === activeIndex;
            return (
              <li
                key={r.id}
                id={`hero-dest-option-${i}`}
                role="option"
                aria-selected={isActive}
                aria-label={label}
                onMouseDown={(e) => { e.preventDefault(); selectResult(r); }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-sm ${
                  isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                } ${i !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center text-base">
                  {thumbnails[r.id] ? (
                    <img
                      src={thumbnails[r.id]}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden="true">{getFlagEmoji(r.country_code)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm shrink-0" aria-hidden="true">{getFlagEmoji(r.country_code)}</span>
                    <span className="font-semibold text-gray-900 truncate">{r.name}</span>
                  </div>
                  {(r.admin1 || r.country) && (
                    <span className="text-xs text-gray-500">
                      {r.admin1 && r.admin1 !== r.name ? `${r.admin1}, ` : ''}{r.country}
                    </span>
                  )}
                </div>
                {isActive && (
                  <span className="shrink-0 text-[#FF6B35] text-xs font-semibold">Select</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
