'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Stats = {
  rides: number;
  active: number;
  completed: number;
  approvedDrivers: number;
  onlineDrivers: number;
  riders: number;
};

type DriverRow = {
  id: string;
  isApproved: boolean;
  status: string;
  user: { fullName: string; email: string; phone?: string };
  vehicle?: { make: string; model: string; plateNumber: string };
};

type RideRow = {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  requestedAt: string;
  rider: { fullName: string };
  driver?: { user: { fullName: string } } | null;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [rides, setRides] = useState<RideRow[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [s, d, r] = await Promise.all([
      api<Stats>('/admin/stats'),
      api<DriverRow[]>('/admin/drivers'),
      api<RideRow[]>('/admin/rides'),
    ]);
    setStats(s);
    setDrivers(d);
    setRides(r);
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      void load().catch((e) => setError(String(e.message || e)));
    }
  }, [user, load]);

  async function setApproval(id: string, approved: boolean) {
    await api(`/admin/drivers/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    });
    await load();
  }

  if (loading || !user) {
    return (
      <AppShell>
        <p>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin dashboard">
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ['Rides', stats?.rides],
          ['Active', stats?.active],
          ['Completed', stats?.completed],
          ['Riders', stats?.riders],
          ['Approved drivers', stats?.approvedDrivers],
          ['Online', stats?.onlineDrivers],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl bg-white/80 p-4 ring-1 ring-brand-100">
            <p className="text-xs uppercase tracking-wide text-brand-700/70">{label}</p>
            <p className="font-display text-2xl text-brand-900">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl text-brand-900">Drivers</h2>
        <div className="overflow-x-auto rounded-2xl bg-white/80 ring-1 ring-brand-100">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-100 text-brand-700/70">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approval</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-b border-brand-50">
                  <td className="px-4 py-3">{d.user.fullName}</td>
                  <td className="px-4 py-3">{d.user.email}</td>
                  <td className="px-4 py-3">
                    {d.vehicle
                      ? `${d.vehicle.make} ${d.vehicle.model} · ${d.vehicle.plateNumber}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{d.status}</td>
                  <td className="px-4 py-3">
                    {d.isApproved ? (
                      <button
                        type="button"
                        onClick={() => void setApproval(d.id, false)}
                        className="text-amber-700 underline"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void setApproval(d.id, true)}
                        className="rounded-lg bg-brand-600 px-2 py-1 text-white"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-brand-900">Recent rides</h2>
        <div className="overflow-x-auto rounded-2xl bg-white/80 ring-1 ring-brand-100">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-100 text-brand-700/70">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Requested</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id} className="border-b border-brand-50">
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.rider.fullName}</td>
                  <td className="px-4 py-3">{r.driver?.user.fullName ?? '—'}</td>
                  <td className="px-4 py-3">
                    {r.pickupAddress} → {r.dropoffAddress}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.requestedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
