'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

const LOCALES = [
  { code: 'en',    flag: '🇦🇺', label: 'EN' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'PT' },
  { code: 'es',    flag: '🇪🇸', label: 'ES' },
];

export default function LanguageSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(0,68,123,0.06)',
        borderRadius: '999px',
        padding: '3px',
        border: '1px solid rgba(0,68,123,0.12)',
      }}
    >
      {LOCALES.map((l) => {
        const isActive = l.code === locale;
        return (
          <button
            key={l.code}
            onClick={() => switchLocale(l.code)}
            aria-label={`Switch to ${l.label}`}
            aria-pressed={isActive}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 11px',
              borderRadius: '999px',
              border: 'none',
              cursor: isActive ? 'default' : 'pointer',
              fontFamily: "'Lato', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              transition: 'background 0.18s, color 0.18s',
              background: isActive ? '#00447B' : 'transparent',
              color:      isActive ? '#ffffff' : '#00447B',
              transform: 'translateZ(0)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,68,123,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            <span
              style={{
                fontSize: '14px',
                lineHeight: 1,
                display: 'inline-block',
                fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
              }}
              aria-hidden="true"
            >
              {l.flag}
            </span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
