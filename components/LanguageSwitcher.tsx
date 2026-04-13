'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt-BR', label: 'Português', short: 'PT' },
  { code: 'es', label: 'Español', short: 'ES' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(newLocale: string) {
    setOpen(false);
    // Strip current locale prefix if present, then add new one
    let newPath = pathname;
    for (const l of LOCALES) {
      if (l.code !== 'en' && pathname.startsWith(`/${l.code}`)) {
        newPath = pathname.slice(`/${l.code}`.length) || '/';
        break;
      }
    }
    if (newLocale === 'en') {
      router.push(newPath);
    } else {
      router.push(`/${newLocale}${newPath}`);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'transparent',
          border: '1.5px solid rgba(0,68,123,0.2)',
          borderRadius: '22px',
          padding: '7px 13px',
          cursor: 'pointer',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          color: '#00447B',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF8210';
          (e.currentTarget as HTMLButtonElement).style.color = '#FF8210';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,68,123,0.2)';
          (e.currentTarget as HTMLButtonElement).style.color = '#00447B';
        }}
      >
        <Globe size={14} strokeWidth={2} />
        {current.short}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'white',
            border: '1px solid rgba(0,68,123,0.12)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            minWidth: '140px',
            zIndex: 300,
            overflow: 'hidden',
          }}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '11px 16px',
                background: l.code === locale ? '#EEF4FB' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                fontWeight: l.code === locale ? 700 : 400,
                color: l.code === locale ? '#00447B' : '#6C6D6F',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (l.code !== locale) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F7F5F2';
                }
              }}
              onMouseLeave={(e) => {
                if (l.code !== locale) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              <span>{l.label}</span>
              <span style={{ fontSize: '12px', color: '#C0C0C0', fontWeight: 400 }}>{l.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
