'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle({ transparent }: { transparent: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" aria-hidden="true" />;

  const isDark = theme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`rounded-lg transition-colors ${transparent ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}`}
    >
      {isDark
        ? <Sun className="w-4 h-4" aria-hidden="true" />
        : <Moon className="w-4 h-4" aria-hidden="true" />
      }
    </Button>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Transparent overlay when on home page and at the very top
  const transparent = isHome && !scrolled;

  return (
    <header
      role="banner"
      className={`fixed top-0 z-50 w-full h-16 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-border/50 shadow-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="AI Travel Planner home"
        >
          <span
            className={`font-extrabold text-sm uppercase tracking-wider transition-colors ${
              transparent ? 'text-white' : 'text-foreground'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            AI Travel
            <span className="text-[#FF6B35]"> Planner</span>
          </span>
        </Link>

        {/* Right nav */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          <Link
            href="/#plan-form"
            className={`hidden sm:inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg ${
              transparent
                ? 'text-white/75 hover:text-white hover:bg-white/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Plan a Trip
          </Link>
          <ThemeToggle transparent={transparent} />
        </nav>
      </div>
    </header>
  );
}
