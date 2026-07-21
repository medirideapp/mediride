'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* PWA optional in dev */
      });
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
