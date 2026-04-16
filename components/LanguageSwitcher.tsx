'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useState, useRef, useEffect } from 'react';

const LOCALES = [
  { code: 'en',    flag: '🇦🇺', label: 'EN' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'PT' },
  { code: 'es',    flag: '🇪🇸', label: 'ES' },
];

export default function LanguageSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  }

  const activeLang = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 11px',
          borderRadius: '999px',
          border: '1px solid rgba(0,68,123,0.18)',
          background: 'rgba(0,68,123,0.06)',
          cursor: 'pointer',
          fontFamily: "'Lato', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          color: '#00447B',
          whiteSpace: 'nowrap',
          transition: 'background 0.18s',
        }}
      >
        <span
          style={{ fontSize: '14px', lineHeight: 1, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
          aria-hidden="true"
        >
          {activeLang.flag}
        </span>
        <span>{activeLang.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s', marginLeft: '2px' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#00447B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Language options"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#ffffff',
            border: '1px solid rgba(0,68,123,0.15)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            zIndex: 300,
            minWidth: '110px',
            padding: '4px',
          }}
        >
          {LOCALES.map((lang) => {
            const isActive = lang.code === locale;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => { setOpen(false); switchLocale(lang.code); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isActive ? 'default' : 'pointer',
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 400,
                  background: isActive ? '#00447B' : 'transparent',
                  color: isActive ? '#ffffff' : '#00447B',
                  transition: 'background 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,68,123,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span
                  style={{ fontSize: '14px', lineHeight: 1, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
                  aria-hidden="true"
                >
                  {lang.flag}
                </span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
