'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  country_code: string;
  admin1?: string;
}


interface DestinationInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputStyle?: CSSProperties;
  iconColor?: string;
  id?: string;
}

export default function DestinationInput({
  value, onChange, placeholder, inputStyle, iconColor = 'var(--orange)', id,
}: DestinationInputProps) {
  const [query,     setQuery]     = useState(value);
  const [results,   setResults]   = useState<GeoResult[]>([]);
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [thumbs,    setThumbs]    = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef      = useRef(false);

  useEffect(() => { if (value !== query) setQuery(value); }, [value]); // eslint-disable-line

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`);
      const data = await res.json();
      const items: GeoResult[] = data.results ?? [];
      setResults(items); setActiveIdx(-1); setThumbs({});
      setOpen(items.length > 0);
      Promise.allSettled(items.map(r =>
        fetch(`/api/place-photo?q=${encodeURIComponent(r.name)}`).then(r => r.json()).then(d => ({ id: r.id, url: d.url as string | null }))
      )).then(settled => {
        const m: Record<number, string> = {};
        settled.forEach(r => { if (r.status === 'fulfilled' && r.value.url) m[r.value.id] = r.value.url; });
        setThumbs(m);
      });
    } catch { setResults([]); setOpen(false); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setQuery(v); onChange(v); skipRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (!skipRef.current) fetchSuggestions(v); }, 300);
  };

  const select = (r: GeoResult) => {
    const parts = [r.name]; if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1); parts.push(r.country);
    const label = parts.join(', ');
    skipRef.current = true; setQuery(label); onChange(label); setOpen(false); setResults([]); setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); select(results[activeIdx]); }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1); }
  };

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) (listRef.current.children[activeIdx] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, display: 'flex', color: iconColor }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </span>
        <input
          ref={inputRef} id={id} type="text" autoComplete="off" value={query}
          onChange={handleChange} onKeyDown={handleKey}
          placeholder={placeholder}
          style={{
            width: '100%', paddingRight: 40, paddingTop: 15, paddingBottom: 15,
            border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-body)', fontSize: 16, color: '#000', background: '#fff', outline: 'none',
            transition: 'border-color 0.18s', boxSizing: 'border-box',
            ...inputStyle,
            paddingLeft: 42,
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,68,123,0.15)')}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(0,68,123,0.2)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--navy)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul ref={listRef} role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', borderRadius: 'var(--r-md)', border: '1px solid rgba(0,68,123,0.12)',
          boxShadow: '0 8px 32px rgba(0,68,123,0.14)', maxHeight: 280, overflowY: 'auto',
          listStyle: 'none', padding: 0, margin: 0,
        }}>
          {results.map((r, i) => {
            const active = i === activeIdx;
            const parts = [r.name]; if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1); parts.push(r.country);
            return (
              <li key={r.id} role="option" aria-selected={active}
                onMouseDown={e => { e.preventDefault(); select(r); }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
                  background: active ? 'rgba(0,68,123,0.05)' : '#fff',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(0,68,123,0.06)' : 'none',
                  transition: 'background 0.12s',
                }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                  background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {thumbs[r.id]
                    ? <img src={thumbs[r.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#679AC1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    )
                  }
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray-dark)', marginTop: 1 }}>
                    {parts.slice(1).join(', ')}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
