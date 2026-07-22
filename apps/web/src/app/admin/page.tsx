'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
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
  isConcierge?: boolean;
  patientName?: string | null;
  assistanceLevel?: string;
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
  const [conciergeMsg, setConciergeMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [orgName, setOrgName] = useState('Clinic');
  const [pickupAddress, setPickupAddress] = useState('Patient home');
  const [dropoffAddress, setDropoffAddress] = useState('Clinic / hospital');
  const [scheduledFor, setScheduledFor] = useState('');
  const [assisted, setAssisted] = useState(true);
  const [wheelchairNeeded, setWheelchairNeeded] = useState(false);

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

  async function bookConcierge(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setConciergeMsg('');
    setError('');
    try {
      await api('/rides/concierge', {
        method: 'POST',
        body: JSON.stringify({
          patientName,
          patientPhone,
          organizationName: orgName,
          pickupAddress,
          pickupLat: 32.7767,
          pickupLng: -96.797,
          dropoffAddress,
          dropoffLat: 32.787,
          dropoffLng: -96.81,
          assistanceLevel: assisted ? 'DOOR_TO_DOOR' : 'NONE',
          wheelchairNeeded,
          ridePurpose: 'Concierge medical transport',
          ...(scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
        }),
      });
      setConciergeMsg(`Ride booked for ${patientName}`);
      setPatientName('');
      setPatientPhone('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Concierge booking failed');
    } finally {
      setBusy(false);
    }
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

      <section className="mb-8 rounded-2xl bg-white/80 p-5 ring-1 ring-brand-100">
        <h2 className="font-display text-xl text-brand-900">MediRide Concierge</h2>
        <p className="mt-1 text-sm text-brand-800/75">
          Book a ride for a patient who does not need the app — same idea as Lyft Concierge.
        </p>
        {conciergeMsg && <p className="mt-2 text-sm text-emerald-700">{conciergeMsg}</p>}
        <form onSubmit={bookConcierge} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Patient name
            <input
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Patient phone
            <input
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Organization
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Schedule (optional)
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            Pickup
            <input
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Dropoff
            <input
              required
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={assisted} onChange={(e) => setAssisted(e.target.checked)} />
            Door-to-door assistance
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wheelchairNeeded}
              onChange={(e) => setWheelchairNeeded(e.target.checked)}
            />
            Wheelchair vehicle
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-white hover:bg-brand-700 disabled:opacity-60 sm:col-span-2"
          >
            {busy ? 'Booking…' : 'Book concierge ride'}
          </button>
        </form>
      </section>

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
                <th className="px-4 py-3">Patient / Rider</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Requested</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id} className="border-b border-brand-50">
                  <td className="px-4 py-3">
                    {r.status}
                    {r.isConcierge ? ' · Concierge' : ''}
                    {r.assistanceLevel === 'DOOR_TO_DOOR' ? ' · Assisted' : ''}
                  </td>
                  <td className="px-4 py-3">{r.patientName || r.rider.fullName}</td>
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
