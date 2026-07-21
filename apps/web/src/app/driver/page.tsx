'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { LiveMap } from '@/components/LiveMap';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTrackingSocket } from '@/lib/use-tracking';

type Ride = {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  fareEstimate?: number;
  notes?: string;
  rider: { fullName: string; phone?: string };
  riderConfirmedStart: boolean;
  driverConfirmedStart: boolean;
  riderConfirmedStop: boolean;
  driverConfirmedStop: boolean;
};

type DriverProfile = {
  id: string;
  status: string;
  isApproved: boolean;
  vehicle?: { make: string; model: string; plateNumber: string };
};

export default function DriverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [openRides, setOpenRides] = useState<Ride[]>([]);
  const [active, setActive] = useState<Ride | null>(null);
  const [error, setError] = useState('');
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);

  const { connected, emitLocation } = useTrackingSocket(active?.id);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DRIVER')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const load = useCallback(async () => {
    const [me, open, mine] = await Promise.all([
      api<DriverProfile>('/drivers/me'),
      api<Ride[]>('/rides/open').catch(() => [] as Ride[]),
      api<Ride[]>('/rides/mine'),
    ]);
    setProfile(me);
    setOpenRides(open);
    const current = mine.find((r) =>
      ['ACCEPTED', 'ARRIVING', 'IN_PROGRESS'].includes(r.status),
    );
    setActive(current ?? null);
  }, []);

  useEffect(() => {
    if (user?.role === 'DRIVER') void load().catch((e) => setError(String(e.message || e)));
  }, [user, load]);

  // GPS ping loop for online drivers
  useEffect(() => {
    if (!profile || profile.status === 'OFFLINE') return;
    if (!navigator.geolocation) return;

    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLat(lat);
        setMyLng(lng);
        void api('/drivers/location', {
          method: 'PATCH',
          body: JSON.stringify({ lat, lng }),
        }).catch(() => undefined);
        if (active?.id) {
          emitLocation({
            rideId: active.id,
            lat,
            lng,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
          });
        }
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 3000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [profile, active?.id, emitLocation]);

  async function setStatus(status: 'AVAILABLE' | 'OFFLINE') {
    const updated = await api<DriverProfile>('/drivers/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setProfile(updated);
    await load();
  }

  async function accept(id: string) {
    const ride = await api<Ride>(`/rides/${id}/accept`, { method: 'PATCH' });
    setActive(ride);
    await load();
  }

  async function arriving() {
    if (!active) return;
    const ride = await api<Ride>(`/rides/${active.id}/arriving`, { method: 'PATCH' });
    setActive(ride);
  }

  async function confirmStart() {
    if (!active) return;
    const ride = await api<Ride>(`/rides/${active.id}/confirm-start`, { method: 'PATCH' });
    setActive(ride);
  }

  async function confirmStop() {
    if (!active) return;
    const ride = await api<Ride>(`/rides/${active.id}/confirm-stop`, { method: 'PATCH' });
    setActive(ride);
    if (ride.status === 'COMPLETED') await load();
  }

  async function saveVehicle() {
    await api('/drivers/vehicle', {
      method: 'POST',
      body: JSON.stringify({
        make: 'Toyota',
        model: 'Sienna',
        year: 2022,
        color: 'Silver',
        plateNumber: 'NEMT-001',
        wheelchair: true,
      }),
    });
    await load();
  }

  const markers = useMemo(() => {
    if (!active) {
      return myLat != null && myLng != null
        ? [{ lat: myLat, lng: myLng, color: '#1d4ed8', label: 'You' }]
        : [];
    }
    const list = [
      { lat: active.pickupLat, lng: active.pickupLng, color: '#0f766e', label: 'Pickup' },
      { lat: active.dropoffLat, lng: active.dropoffLng, color: '#b45309', label: 'Dropoff' },
    ];
    if (myLat != null && myLng != null) {
      list.push({ lat: myLat, lng: myLng, color: '#1d4ed8', label: 'You' });
    }
    return list;
  }, [active, myLat, myLng]);

  if (loading || !user) {
    return (
      <AppShell>
        <p>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Driver console">
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-brand-100">
        <p className="text-sm">
          Status: <strong>{profile?.status ?? '…'}</strong>
          {!profile?.isApproved && (
            <span className="ml-2 text-amber-700">(awaiting admin approval)</span>
          )}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          WS {connected ? 'live' : 'offline'}
        </span>
        <button
          type="button"
          onClick={() => void setStatus('AVAILABLE')}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white"
        >
          Go online
        </button>
        <button
          type="button"
          onClick={() => void setStatus('OFFLINE')}
          className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm"
        >
          Go offline
        </button>
        {!profile?.vehicle && (
          <button
            type="button"
            onClick={() => void saveVehicle()}
            className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm"
          >
            Add sample vehicle
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {active ? (
            <div className="space-y-3 rounded-2xl bg-white/80 p-5 ring-1 ring-brand-100">
              <p className="font-display text-xl">Active: {active.status}</p>
              <p className="text-sm">
                Rider: {active.rider.fullName}
                {active.rider.phone ? ` · ${active.rider.phone}` : ''}
              </p>
              <p className="text-sm">
                {active.pickupAddress} → {active.dropoffAddress}
              </p>
              <div className="flex flex-wrap gap-2">
                {active.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    onClick={() => void arriving()}
                    className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white"
                  >
                    Mark arriving
                  </button>
                )}
                {['ACCEPTED', 'ARRIVING'].includes(active.status) && (
                  <button
                    type="button"
                    onClick={() => void confirmStart()}
                    disabled={active.driverConfirmedStart}
                    className="rounded-lg bg-brand-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {active.driverConfirmedStart ? 'Start confirmed' : 'Confirm start'}
                  </button>
                )}
                {active.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => void confirmStop()}
                    disabled={active.driverConfirmedStop}
                    className="rounded-lg bg-brand-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {active.driverConfirmedStop ? 'Stop confirmed' : 'Confirm end'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="font-display text-xl text-brand-900">Open requests</h2>
              {openRides.length === 0 && (
                <p className="text-sm text-brand-700/70">No open ride requests nearby.</p>
              )}
              {openRides.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white/80 p-4 ring-1 ring-brand-100"
                >
                  <p className="font-medium">{r.rider.fullName}</p>
                  <p className="text-sm text-brand-800/80">
                    {r.pickupAddress} → {r.dropoffAddress}
                  </p>
                  {r.fareEstimate != null && (
                    <p className="text-sm">Est. ${r.fareEstimate.toFixed(2)}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void accept(r.id)}
                    className="mt-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white"
                  >
                    Accept ride
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <LiveMap
          center={{
            lat: myLat ?? active?.pickupLat ?? 32.7767,
            lng: myLng ?? active?.pickupLng ?? -96.797,
          }}
          markers={markers}
          className="h-[28rem] w-full overflow-hidden rounded-2xl ring-1 ring-brand-100"
        />
      </div>
    </AppShell>
  );
}
