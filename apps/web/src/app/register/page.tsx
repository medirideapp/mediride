'use client';

import { Suspense } from 'react';
import RegisterForm from './register-form';
import { AppShell } from '@/components/AppShell';

export default function RegisterPage() {
  return (
    <AppShell title="Create account">
      <Suspense fallback={<p className="text-sm text-brand-700">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </AppShell>
  );
}
