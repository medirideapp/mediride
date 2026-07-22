'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
  scheduledFor?: string | null;
  assistanceLevel?: string;
  wheelchairNeeded?: boolean;
  ridePurpose?: string;
  riderConfirmedStart: boolean;
  driverConfirmedStart: boolean;
  riderConfirmedStop: boolean;
  driverConfirmedStop: boolean;
  driver?: {
    user: { fullName: string; phone?: string };
    vehicle?: { make: string; model: string; plateNumber: string; color?: string };
    lastLat?: number;
    lastLng?: number;
  };
};

export default function RiderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('Home / Clinic pickup');
  const [dropoffAddress, setDropoffAddress] = useState('Medical appointment');
  const [pickupLat, setPickupLat] = useState(32.7767);
  const [pickupLng, setPickupLng] = useState(-96.797);
  const [dropoffLat, setDropoffLat] = useState(32.787);
  const [dropoffLng, setDropoffLng] = useState(-96.81);
  const [scheduledFor, setScheduledFor] = useState('');
  const [assisted, setAssisted] = useState(false);
  const [wheelchairNeeded, setWheelchairNeeded] = useState(false);
  const [ridePurpose, setRidePurpose] = useState('Medical appointment');

  const { connected, location } = useTrackingSocket(ride?.id);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'RIDER')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const refreshRide = useCallback(async (id: string) => {
    const data = await api<Ride>(`/rides/${id}`);
    setRide(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    api<Ride[]>('/rides/mine')
      .then((rides) => {
        const active = rides.find((r) =>
          ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS'].includes(r.status),
        );
        if (active) setRide(active);
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!ride?.id) return;
    const t = setInterval(() => {
      void refreshRide(ride.id);
    }, 8000);
    return () => clearInterval(t);
  }, [ride?.id, refreshRide]);

  async function requestRide(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api<{ ride: Ride }>('/rides', {
        method: 'POST',
        body: JSON.stringify({
          pickupAddress,
          pickupLat,
          pickupLng,
          dropoffAddress,
          dropoffLat,
          dropoffLng,
          ridePurpose,
          wheelchairNeeded,
          assistanceLevel: assisted ? 'DOOR_TO_DOOR' : 'NONE',
          ...(scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
        }),
      });
      setRide(res.ride);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmStart() {
    if (!ride) return;
    const updated = await api<Ride>(`/rides/${ride.id}/confirm-start`, { method: 'PATCH' });
    setRide(updated);
  }

  async function confirmStop() {
    if (!ride) return;
    const updated = await api<Ride>(`/rides/${ride.id}/confirm-stop`, { method: 'PATCH' });
    setRide(updated);
  }

  async function cancel() {
    if (!ride) return;
    const updated = await api<Ride>(`/rides/${ride.id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Cancelled by rider' }),
    });
    setRide(updated);
  }

  const markers = useMemo(() => {
    const list = [
      { lat: ride?.pickupLat ?? pickupLat, lng: ride?.pickupLng ?? pickupLng, color: '#0f766e', label: 'Pickup' },
      { lat: ride?.dropoffLat ?? dropoffLat, lng: ride?.dropoffLng ?? dropoffLng, color: '#b45309', label: 'Dropoff' },
    ];
    const dLat = location?.lat ?? ride?.driver?.lastLat;
    const dLng = location?.lng ?? ride?.driver?.lastLng;
    if (dLat != null && dLng != null) {
      list.push({ lat: dLat, lng: dLng, color: '#1d4ed8', label: 'Driver' });
    }
    return list;
  }, [ride, location, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-brand-700">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Book a medical ride">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {!ride || ['COMPLETED', 'CANCELLED'].includes(ride.status) ? (
            <form
              onSubmit={requestRide}
              className="space-y-3 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-brand-100"
            >
              {error && <p className="text-sm text-red-700">{error}</p>}
              <label className="block text-sm">
                Pickup address
                <input
                  className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  Pickup lat
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                    value={pickupLat}
                    onChange={(e) => setPickupLat(Number(e.target.value))}
                  />
                </label>
                <label className="block text-sm">
                  Pickup lng
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                    value={pickupLng}
                    onChange={(e) => setPickupLng(Number(e.target.value))}
                  />
                </label>
              </div>
              <label className="block text-sm">
                Dropoff address
                <input
                  className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                Purpose
                <input
                  className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                  value={ridePurpose}
                  onChange={(e) => setRidePurpose(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Schedule for later (optional)
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={assisted}
                  onChange={(e) => setAssisted(e.target.checked)}
                />
                Door-to-door assistance (MediRide Assisted)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wheelchairNeeded}
                  onChange={(e) => setWheelchairNeeded(e.target.checked)}
                />
                Wheelchair-accessible vehicle needed
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  Dropoff lat
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                    value={dropoffLat}
                    onChange={(e) => setDropoffLat(Number(e.target.value))}
                  />
                </label>
                <label className="block text-sm">
                  Dropoff lng
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2"
                    value={dropoffLng}
                    onChange={(e) => setDropoffLng(Number(e.target.value))}
                  />
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-brand-700 underline"
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setPickupLat(pos.coords.latitude);
                    setPickupLng(pos.coords.longitude);
                  });
                }}
              >
                Use my current location for pickup
              </button>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? 'Requesting…' : 'Request ride'}
              </button>
            </form>
          ) : (
            <div className="space-y-3 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-brand-100">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl text-brand-900">Status: {ride.status}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {connected ? 'Live' : 'Connecting…'}
                </span>
              </div>
              <p className="text-sm text-brand-800/80">
                {ride.pickupAddress} → {ride.dropoffAddress}
              </p>
              {ride.scheduledFor && (
                <p className="text-sm">Scheduled: {new Date(ride.scheduledFor).toLocaleString()}</p>
              )}
              {ride.assistanceLevel === 'DOOR_TO_DOOR' && (
                <p className="text-sm text-brand-700">Door-to-door assistance requested</p>
              )}
              {ride.wheelchairNeeded && (
                <p className="text-sm text-brand-700">Wheelchair-accessible vehicle</p>
              )}
              {ride.fareEstimate != null && (
                <p className="text-sm">Est. fare: ${ride.fareEstimate.toFixed(2)}</p>
              )}
              {ride.driver && (
                <div className="rounded-xl bg-mist p-3 text-sm">
                  <p className="font-medium">{ride.driver.user.fullName}</p>
                  {ride.driver.vehicle && (
                    <p>
                      {ride.driver.vehicle.color} {ride.driver.vehicle.make}{' '}
                      {ride.driver.vehicle.model} · {ride.driver.vehicle.plateNumber}
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['ACCEPTED', 'ARRIVING'].includes(ride.status) && (
                  <button
                    type="button"
                    onClick={() => void confirmStart()}
                    disabled={ride.riderConfirmedStart}
                    className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {ride.riderConfirmedStart ? 'Start confirmed' : 'Confirm trip start'}
                  </button>
                )}
                {ride.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => void confirmStop()}
                    disabled={ride.riderConfirmedStop}
                    className="rounded-lg bg-brand-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {ride.riderConfirmedStop ? 'Stop confirmed' : 'Confirm trip end'}
                  </button>
                )}
                {!['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(ride.status) && (
                  <button
                    type="button"
                    onClick={() => void cancel()}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <p className="text-xs text-brand-700/70">
                Start: rider {ride.riderConfirmedStart ? '✓' : '…'} / driver{' '}
                {ride.driverConfirmedStart ? '✓' : '…'} · Stop: rider{' '}
                {ride.riderConfirmedStop ? '✓' : '…'} / driver {ride.driverConfirmedStop ? '✓' : '…'}
              </p>
            </div>
          )}
        </div>
        <LiveMap
          center={{ lat: location?.lat ?? ride?.pickupLat ?? pickupLat, lng: location?.lng ?? ride?.pickupLng ?? pickupLng }}
          markers={markers}
          className="h-[28rem] w-full overflow-hidden rounded-2xl ring-1 ring-brand-100"
        />
      </div>
    </AppShell>
  );
}
