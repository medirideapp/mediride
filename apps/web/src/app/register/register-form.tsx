'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = useMemo(
    () => (params.get('role') === 'DRIVER' ? 'DRIVER' : 'RIDER'),
    [params],
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>(defaultRole);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await register({ email, password, fullName, phone, role });
      router.push(user.role === 'DRIVER' ? '/driver' : '/rider');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-brand-100"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="flex gap-2 rounded-xl bg-mist p-1">
        {(['RIDER', 'DRIVER'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-lg py-2 text-sm ${
              role === r ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-700/70'
            }`}
          >
            {r === 'RIDER' ? 'I need a ride' : 'I am a driver'}
          </button>
        ))}
      </div>
      <label className="block text-sm">
        Full name
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Phone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Password (min 8)
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? 'Creating…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-brand-800/70">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-700 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
