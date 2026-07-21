'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Marker = { lat: number; lng: number; color?: string; label?: string };

type LiveMapProps = {
  center?: { lat: number; lng: number };
  markers?: Marker[];
  className?: string;
  zoom?: number;
};

export function LiveMap({
  center = { lat: 32.7767, lng: -96.797 },
  markers = [],
  className = 'h-72 w-full rounded-xl',
  zoom = 12,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!containerRef.current || mapRef.current) return;

    if (!token || token.includes('your_mapbox')) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = markers.map((m) => {
      const el = document.createElement('div');
      el.className = 'h-3 w-3 rounded-full border-2 border-white shadow';
      el.style.background = m.color || '#0f766e';
      const marker = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).addTo(map);
      if (m.label) {
        marker.setPopup(new mapboxgl.Popup({ offset: 12 }).setText(m.label));
      }
      return marker;
    });

    if (markers.length === 1) {
      map.easeTo({ center: [markers[0].lng, markers[0].lat], duration: 500 });
    } else if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 500 });
    }
  }, [markers]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const missingToken = !token || token.includes('your_mapbox');

  return (
    <div className={`relative overflow-hidden bg-brand-100 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {missingToken && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-100/95 p-4 text-center">
          <p className="font-display text-lg text-brand-900">Live map</p>
          <p className="max-w-sm text-sm text-brand-700">
            Set <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{' '}
            <code className="rounded bg-white/80 px-1">.env</code> to enable Mapbox. Coordinates
            still update over WebSocket without a token.
          </p>
          {markers[0] && (
            <p className="font-mono text-xs text-brand-700">
              {markers[0].lat.toFixed(5)}, {markers[0].lng.toFixed(5)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
