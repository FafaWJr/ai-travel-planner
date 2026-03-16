'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plane, Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" aria-hidden="true" />;

  const isDark = theme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg"
    >
      {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
    </Button>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/90 dark:bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-background/70 shadow-sm" role="banner">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-extrabold transition-opacity hover:opacity-80"
          aria-label="AI Travel Planner home"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-sm">
            <Plane className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
            AI Travel Planner
          </span>
        </Link>

        <nav className="flex items-center gap-2" aria-label="Main navigation">
          <Link
            href="/#plan-form"
            className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors hidden sm:inline"
          >
            Plan a Trip
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
