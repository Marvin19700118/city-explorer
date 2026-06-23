import type { Trail } from './types';
import data from './seedTrailsData.json';

const seedTrails: Trail[] = (data as any[]).map(d => ({
  id: d.id,
  name: d.name,
  district: d.district,
  county: d.county,
  duration: d.duration,
  difficulty: d.difficulty as Trail['difficulty'],
  trailType: d.trailType,
  entranceAddress: d.entranceAddress,
  hikingUrl: d.hikingUrl,
  centerLat: d.centerLat ?? undefined,
  centerLng: d.centerLng ?? undefined,
  totalDistanceKm: d.totalDistanceKm ?? 0,
  elevationGainM: d.elevationGainM ?? 0,
  points: [],
  waypoints: [],
  walkedPoints: [],
  walkedDistanceKm: 0,
  completionPercent: 0,
  importedAt: '2026-01-01T00:00:00.000Z',
}));

export default seedTrails;
