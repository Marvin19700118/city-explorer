import type { Trail, LatLng, TrailDifficulty } from './types';

const DIFFICULTY_XP_PER_KM: Record<TrailDifficulty, number> = {
  easy: 50,
  moderate: 100,
  hard: 200,
  expert: 400,
};

const WALK_THRESHOLD = 0.001; // ~100m in degrees

export function checkTrailCompletion(trail: Trail, tripPaths: LatLng[][]): Trail {
  const walkedSet = new Set(trail.walkedPoints);

  for (let i = 0; i < trail.points.length; i++) {
    if (walkedSet.has(i)) continue;
    const tp = trail.points[i];
    outer: for (const tripPath of tripPaths) {
      for (const pp of tripPath) {
        const d = Math.sqrt((tp.lat - pp.lat) ** 2 + (tp.lng - pp.lng) ** 2);
        if (d < WALK_THRESHOLD) {
          walkedSet.add(i);
          break outer;
        }
      }
    }
  }

  const walkedPoints = Array.from(walkedSet).sort((a, b) => a - b);
  const completionPercent = trail.points.length > 0
    ? Math.round((walkedPoints.length / trail.points.length) * 100)
    : 0;

  // Compute walked distance from consecutive walked pairs
  let walkedDistanceKm = 0;
  for (let i = 1; i < trail.points.length; i++) {
    if (walkedSet.has(i - 1) && walkedSet.has(i)) {
      const a = trail.points[i - 1];
      const b = trail.points[i];
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const sin2 = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      walkedDistanceKm += 6371 * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
    }
  }

  return { ...trail, walkedPoints, walkedDistanceKm, completionPercent };
}

export function getTrailXpBonus(trail: Trail, prevWalkedKm: number): number {
  const newKm = trail.walkedDistanceKm - prevWalkedKm;
  if (newKm <= 0) return 0;
  return Math.floor(newKm * DIFFICULTY_XP_PER_KM[trail.difficulty]);
}

/** Extract consecutive walked segments for polyline rendering */
export function getWalkedSegments(trail: Trail): LatLng[][] {
  const walkedSet = new Set(trail.walkedPoints);
  const segments: LatLng[][] = [];
  let current: LatLng[] = [];

  for (let i = 0; i < trail.points.length; i++) {
    if (walkedSet.has(i)) {
      current.push({ lat: trail.points[i].lat, lng: trail.points[i].lng });
    } else {
      if (current.length > 1) segments.push(current);
      current = [];
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}
