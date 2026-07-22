'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-mist text-ink">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-display text-xl tracking-tight text-brand-700">
            MediRide
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {user?.role === 'RIDER' && (
              <Link className="hover:text-brand-600" href="/rider">
                Book
              </Link>
            )}
            {user?.role === 'DRIVER' && (
              <Link className="hover:text-brand-600" href="/driver">
                Drive
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link className="hover:text-brand-600" href="/admin">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <span className="hidden text-brand-700 sm:inline">{user.fullName}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {title && <h1 className="mb-4 font-display text-3xl text-brand-900">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
