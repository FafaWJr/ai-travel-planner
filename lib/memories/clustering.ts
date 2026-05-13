// lib/memories/clustering.ts
import type { GpsCluster } from './geocode-types';

/** Photo with GPS data for clustering */
export interface GpsPhoto {
  lat: number;
  lng: number;
  timestamp: string; // ISO date string
}

const CLUSTER_THRESHOLD_M = 500; // metres, photos within this distance belong to same cluster
const LATE_NIGHT_HOUR = 4; // photos before 4am may belong to previous day

/**
 * Haversine distance between two GPS coordinates in metres.
 */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Cluster photos by geographic proximity, walking chronologically.
 *
 * Algorithm:
 * 1. Sort photos by timestamp.
 * 2. Walk through chronologically.
 * 3. If next photo is within CLUSTER_THRESHOLD_M of the current cluster centroid, add it.
 * 4. If further, start a new cluster.
 * 5. Recalculate centroid after each addition.
 */
export function clusterPhotos(photos: GpsPhoto[]): GpsCluster[] {
  if (photos.length === 0) return [];

  const sorted = [...photos].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const clusters: { lats: number[]; lngs: number[]; times: string[] }[] = [];
  let current = { lats: [sorted[0].lat], lngs: [sorted[0].lng], times: [sorted[0].timestamp] };

  for (let i = 1; i < sorted.length; i++) {
    const photo = sorted[i];
    const centLat = current.lats.reduce((s, v) => s + v, 0) / current.lats.length;
    const centLng = current.lngs.reduce((s, v) => s + v, 0) / current.lngs.length;
    const dist = haversineMetres(centLat, centLng, photo.lat, photo.lng);

    if (dist <= CLUSTER_THRESHOLD_M) {
      current.lats.push(photo.lat);
      current.lngs.push(photo.lng);
      current.times.push(photo.timestamp);
    } else {
      clusters.push(current);
      current = { lats: [photo.lat], lngs: [photo.lng], times: [photo.timestamp] };
    }
  }
  clusters.push(current);

  return clusters.map(c => {
    const centroidLat = c.lats.reduce((s, v) => s + v, 0) / c.lats.length;
    const centroidLng = c.lngs.reduce((s, v) => s + v, 0) / c.lngs.length;

    let maxDist = 0;
    for (let i = 0; i < c.lats.length; i++) {
      const d = haversineMetres(centroidLat, centroidLng, c.lats[i], c.lngs[i]);
      if (d > maxDist) maxDist = d;
    }

    const confidence: GpsCluster['confidence'] =
      c.lats.length >= 3 ? 'high' : c.lats.length >= 1 ? 'medium' : 'low';

    return {
      centroidLat: Math.round(centroidLat * 1000000) / 1000000,
      centroidLng: Math.round(centroidLng * 1000000) / 1000000,
      photoCount: c.lats.length,
      startTime: c.times[0] ?? null,
      endTime: c.times[c.times.length - 1] ?? null,
      spreadMetres: Math.round(maxDist),
      confidence,
    };
  });
}

/**
 * Check if a photo timestamp falls in the "late night" window (midnight to 4am).
 * These photos may belong to the previous day's experience.
 */
export function isLateNight(timestamp: string): boolean {
  const hour = new Date(timestamp).getHours();
  return hour >= 0 && hour < LATE_NIGHT_HOUR;
}

/**
 * Determine if late-night photos should be reassigned to the previous day.
 * Returns true if any late-night photo is within 1km of the previous day's last cluster.
 */
export function shouldReassignLateNight(
  lateNightPhotos: GpsPhoto[],
  previousDayLastCluster: GpsCluster | null,
): boolean {
  if (!previousDayLastCluster || lateNightPhotos.length === 0) return false;

  const threshold = 1000; // 1km
  return lateNightPhotos.some(photo =>
    haversineMetres(
      previousDayLastCluster.centroidLat,
      previousDayLastCluster.centroidLng,
      photo.lat,
      photo.lng,
    ) <= threshold,
  );
}
