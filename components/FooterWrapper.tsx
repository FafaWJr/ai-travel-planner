'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function FooterWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/auth')) return null;
  return <>{children}</>;
}
