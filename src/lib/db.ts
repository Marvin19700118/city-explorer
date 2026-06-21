import { db } from './firebase';
import {
  doc, getDoc, setDoc, collection, getDocs, deleteDoc,
} from 'firebase/firestore';
import type { PointOfInterest, Trip, Settings, CityPoints, Trail, AskedQuestionHistory } from './types';
import { SEED_TRAILS } from './seedTrails';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyStats = {
  date: string;
  distance: number;
  goalKm: number;
};

export type Streak = {
  lastWalkDate: string;
  count: number;
};

export type NearbyPoisMeta = {
  center: { lat: number; lng: number };
  fetchedAt: number;
};

export type GameData = {
  pois: PointOfInterest[];
  cityPoints: CityPoints;
  settings: Settings;
  askedQuestions: AskedQuestionHistory;
  nearbyPoisMeta: NearbyPoisMeta | null;
  dailyStats: DailyStats;
  streak: Streak;
  placesApiCallCount: number;
  geminiApiCallCount: number;
};

export type TrailProgress = {
  walkedPoints: number[];   // indices into trail.points
  walkedDistanceKm: number;
  completionPercent: number;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function defaultGameData(): GameData {
  return {
    pois: [],
    cityPoints: {},
    settings: { fogOpacity: 70, areaNotifications: true },
    askedQuestions: {},
    nearbyPoisMeta: null,
    dailyStats: { date: todayStr(), distance: 0, goalKm: 2.0 },
    streak: { lastWalkDate: '', count: 0 },
    placesApiCallCount: 0,
    geminiApiCallCount: 0,
  };
}

// ─── Game Data ────────────────────────────────────────────────────────────────

const gameDataRef = (uid: string) => doc(db, 'users', uid, 'data', 'game');

export async function loadGameData(uid: string): Promise<GameData> {
  const snap = await getDoc(gameDataRef(uid));
  if (snap.exists()) return { ...defaultGameData(), ...(snap.data() as Partial<GameData>) };
  return defaultGameData();
}

export async function saveGameData(uid: string, data: Partial<GameData>): Promise<void> {
  await setDoc(gameDataRef(uid), data, { merge: true });
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export async function loadTrips(uid: string): Promise<Trip[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'trips'));
  return snap.docs.map(d => d.data() as Trip).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function addTrip(uid: string, trip: Trip): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'trips', trip.id), trip);
}

export async function deleteTrip(uid: string, tripId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'trips', tripId));
}

export async function updateTripMeta(uid: string, tripId: string, name: string, notes: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'trips', tripId), { name, notes }, { merge: true });
}

// ─── Trail Progress ───────────────────────────────────────────────────────────

export async function loadAllTrailProgress(uid: string): Promise<Record<string, TrailProgress>> {
  const snap = await getDocs(collection(db, 'users', uid, 'trailProgress'));
  const result: Record<string, TrailProgress> = {};
  snap.docs.forEach(d => { result[d.id] = d.data() as TrailProgress; });
  return result;
}

export async function saveTrailProgress(uid: string, trailId: string, progress: TrailProgress): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'trailProgress', trailId), progress);
}

// ─── Custom Trails (user-imported GPX) ───────────────────────────────────────

export async function loadCustomTrails(uid: string): Promise<Trail[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'customTrails'));
  return snap.docs.map(d => d.data() as Trail);
}

export async function saveCustomTrailDoc(uid: string, trail: Trail): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'customTrails', trail.id), trail);
}

export async function deleteCustomTrailDoc(uid: string, trailId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'customTrails', trailId));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Merge seed + custom trails, applying saved progress */
export function buildTrails(customTrails: Trail[], progress: Record<string, TrailProgress>): Trail[] {
  return [...SEED_TRAILS, ...customTrails].map(trail => {
    const prog = progress[trail.id];
    if (!prog) return trail;
    return {
      ...trail,
      walkedPoints: prog.walkedPoints,
      walkedDistanceKm: prog.walkedDistanceKm,
      completionPercent: prog.completionPercent,
    };
  });
}

/** Compute updated DailyStats after adding distance */
export function computeAddDistance(stats: DailyStats, km: number): DailyStats {
  const today = todayStr();
  const base = stats.date === today ? stats : { ...stats, date: today, distance: 0 };
  return { ...base, distance: base.distance + km };
}

/** Compute updated Streak after recording a walk today */
export function computeStreak(streak: Streak): Streak {
  const today = todayStr();
  if (streak.lastWalkDate === today) return streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  return { lastWalkDate: today, count: streak.lastWalkDate === yStr ? streak.count + 1 : 1 };
}
