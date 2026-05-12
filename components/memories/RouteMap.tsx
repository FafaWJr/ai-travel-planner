'use client';

import { useEffect, useRef } from 'react';
import type { PhotoMeta } from '@/lib/memories/types';

const DAY_COLORS = [
  '#FF8210', '#00447B', '#4A9D5B', '#C0547A',
  '#679AC1', '#FFBD59', '#6C6D6F', '#DC2626',
];

interface GpsPoint {
  lat: number;
  lng: number;
  dayNumber: number;
  dayTitle: string;
}

interface RouteMapProps {
  days: Array<{
    dayNumber: number;
    dayTitle: string;
    photos: PhotoMeta[];
  }>;
  height?: number;
}

export default function RouteMap({ days, height = 280 }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);

  const points: GpsPoint[] = [];
  for (const day of days) {
    for (const photo of (day.photos ?? [])) {
      if (photo.exifLat !== null && photo.exifLng !== null) {
        points.push({
          lat: photo.exifLat,
          lng: photo.exifLng,
          dayNumber: day.dayNumber,
          dayTitle: day.dayTitle,
        });
      }
    }
  }

  if (points.length < 2) return null;

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      const dayGroups = new Map<number, GpsPoint[]>();
      for (const pt of points) {
        if (!dayGroups.has(pt.dayNumber)) dayGroups.set(pt.dayNumber, []);
        dayGroups.get(pt.dayNumber)!.push(pt);
      }

      const allLatLngs: [number, number][] = [];
      for (const [dayNum, dayPoints] of dayGroups) {
        const color = DAY_COLORS[(dayNum - 1) % DAY_COLORS.length];
        const latLngs: [number, number][] = dayPoints.map(p => [p.lat, p.lng]);
        allLatLngs.push(...latLngs);

        if (latLngs.length > 1) {
          L.polyline(latLngs, {
            color, weight: 3, opacity: 0.7,
            dashArray: '8 4',
          }).addTo(map);
        }

        for (const pt of dayPoints) {
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:24px;height:24px;border-radius:50%;
              background:${color};color:#fff;
              display:flex;align-items:center;justify-content:center;
              font-family:'Poppins',sans-serif;font-weight:700;font-size:11px;
              border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);
            ">${dayNum}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker([pt.lat, pt.lng], { icon })
            .bindPopup(`<b>Day ${pt.dayNumber}</b><br/>${pt.dayTitle}`)
            .addTo(map);
        }
      }

      if (allLatLngs.length > 1) {
        L.polyline(allLatLngs, {
          color: '#00447B', weight: 2, opacity: 0.3,
          dashArray: '4 6',
        }).addTo(map);
      }

      if (allLatLngs.length > 0) {
        map.fitBounds(allLatLngs, { padding: [30, 30] });
      }

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        (leafletMapRef.current as { remove: () => void }).remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: '1.5px solid rgba(0,68,123,0.10)',
      boxShadow: '0 2px 8px rgba(0,68,123,0.04)',
      marginBottom: 24,
    }}>
      <div ref={mapRef} style={{ width: '100%', height }} />
    </div>
  );
}
