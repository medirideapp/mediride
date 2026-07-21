'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export type LocationUpdate = {
  rideId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  at: string;
};

export function useTrackingSocket(rideId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [location, setLocation] = useState<LocationUpdate | null>(null);
  const [rideEvent, setRideEvent] = useState<{ event: string; data?: unknown } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(`${WS_URL}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('location_update', (payload: LocationUpdate) => setLocation(payload));
    socket.on('ride_event', (payload: { event: string; data?: unknown }) => setRideEvent(payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!rideId || !socketRef.current?.connected) return;
    socketRef.current.emit('join_ride', { rideId });
  }, [rideId, connected]);

  const emitLocation = (payload: {
    rideId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }) => {
    socketRef.current?.emit('driver_location', payload);
  };

  return { connected, location, rideEvent, emitLocation, socket: socketRef };
}
