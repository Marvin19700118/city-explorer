'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInAnonymously, onAuthStateChanged,
  GoogleAuthProvider, linkWithPopup, linkWithRedirect,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  loadGameData, saveGameData,
  loadTrips, addTrip as dbAddTrip, deleteTrip as dbDeleteTrip,
  loadAllTrailProgress, saveTrailProgress,
  loadCustomTrails, saveCustomTrailDoc, deleteCustomTrailDoc,
  buildTrails, computeAddDistance, computeStreak,
  defaultGameData,
  type GameData, type TrailProgress, type DailyStats, type Streak,
} from '@/lib/db';
import type { PointOfInterest, Trip, Settings, CityPoints, Trail, AskedQuestionHistory } from '@/lib/types';

// ─── Context type ─────────────────────────────────────────────────────────────

interface GameContextType {
  uid: string | null;
  isLoading: boolean;
  isAnonymous: boolean;
  googleEmail: string | null;
  linkWithGoogle: () => Promise<void>;
  switchToGoogleAccount: () => Promise<void>;

  // POIs
  pois: PointOfInterest[];
  updatePois: (pois: PointOfInterest[]) => Promise<void>;

  // Trips
  trips: Trip[];
  addTrip: (trip: Trip) => Promise<void>;
  removeTrip: (tripId: string) => Promise<void>;

  // City Points / XP
  cityPoints: CityPoints;
  addXp: (xpGained: number, county: string, district: string) => Promise<void>;

  // Settings
  settings: Settings;
  updateSettings: (s: Settings) => Promise<void>;

  // Asked Questions
  askedQuestions: AskedQuestionHistory;
  updateAskedQuestions: (aq: AskedQuestionHistory) => Promise<void>;

  // Daily Stats & Streak
  dailyStats: DailyStats;
  streak: Streak;
  addDistanceToday: (km: number) => Promise<void>;
  recordWalkToday: () => Promise<void>;

  // Trails (seed + custom + progress merged)
  trails: Trail[];
  updateTrailProgress: (trailId: string, progress: TrailProgress) => Promise<void>;
  addCustomTrail: (trail: Trail) => Promise<void>;
  removeCustomTrail: (trailId: string) => Promise<void>;

  // API counts
  placesApiCallCount: number;
  geminiApiCallCount: number;
  incrementPlacesCount: () => Promise<void>;
  incrementGeminiCount: () => Promise<void>;
  resetApiCounts: () => Promise<void>;

  // Nearby POIs meta
  nearbyPoisMeta: GameData['nearbyPoisMeta'];
  updateNearbyPoisMeta: (meta: GameData['nearbyPoisMeta']) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextType | null>(null);

export function FirebaseGameProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Game data state
  const [gameData, setGameData] = useState<GameData>(defaultGameData());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [customTrails, setCustomTrails] = useState<Trail[]>([]);
  const [trailProgress, setTrailProgress] = useState<Record<string, TrailProgress>>({});

  const isMobile = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // SessionStorage key — survives redirect navigation, cleared after sign-in
  const REDIRECT_KEY = 'ts_google_redirect';

  // ─── Auth: handle redirect result first, then normal auth state ───────────
  useEffect(() => {
    // Process any pending redirect sign-in result on page load
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          // Redirect completed — clear flag; onAuthStateChanged handles the rest
          sessionStorage.removeItem(REDIRECT_KEY);
        }
      })
      .catch(() => {
        // Redirect failed or was cancelled — allow anonymous fallback
        sessionStorage.removeItem(REDIRECT_KEY);
      });
  }, []);

  // ─── Auth: sign in anonymously ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        sessionStorage.removeItem(REDIRECT_KEY);
        setUid(user.uid);
        setIsAnonymous(user.isAnonymous);
        setGoogleEmail(user.email);
      } else {
        // Skip anonymous sign-in if we're mid-redirect to Google
        if (sessionStorage.getItem(REDIRECT_KEY)) return;
        const cred = await signInAnonymously(auth);
        setUid(cred.user.uid);
        setIsAnonymous(true);
        setGoogleEmail(null);
      }
    });
    return unsub;
  }, []);

  const linkWithGoogle = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not signed in');
    const provider = new GoogleAuthProvider();
    if (isMobile()) {
      sessionStorage.setItem(REDIRECT_KEY, '1');
      await linkWithRedirect(auth.currentUser, provider);
    } else {
      const result = await linkWithPopup(auth.currentUser, provider);
      setIsAnonymous(false);
      setGoogleEmail(result.user.email);
    }
  }, []);

  const switchToGoogleAccount = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    if (isMobile()) {
      // Set flag BEFORE sign-out so onAuthStateChanged(null) skips anonymous
      sessionStorage.setItem(REDIRECT_KEY, '1');
      await firebaseSignOut(auth);
      await signInWithRedirect(auth, provider);
    } else {
      await firebaseSignOut(auth);
      await signInWithPopup(auth, provider);
    }
  }, []);

  // ─── Load all data when uid is ready ──────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const [gd, loadedTrips, customTr, progress] = await Promise.all([
        loadGameData(uid),
        loadTrips(uid),
        loadCustomTrails(uid),
        loadAllTrailProgress(uid),
      ]);
      setGameData(gd);
      setTrips(loadedTrips);
      setCustomTrails(customTr);
      setTrailProgress(progress);
      setTrails(buildTrails(customTr, progress));
      setIsLoading(false);
    })();
  }, [uid]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const partialSave = useCallback(async (patch: Partial<GameData>) => {
    if (!uid) return;
    setGameData(prev => ({ ...prev, ...patch }));
    await saveGameData(uid, patch);
  }, [uid]);

  // ─── POIs ─────────────────────────────────────────────────────────────────
  const updatePois = useCallback(async (pois: PointOfInterest[]) => {
    await partialSave({ pois });
  }, [partialSave]);

  // ─── Trips ────────────────────────────────────────────────────────────────
  const addTrip = useCallback(async (trip: Trip) => {
    if (!uid) return;
    setTrips(prev => [trip, ...prev]);
    await dbAddTrip(uid, trip);
  }, [uid]);

  const removeTrip = useCallback(async (tripId: string) => {
    if (!uid) return;
    setTrips(prev => prev.filter(t => t.id !== tripId));
    await dbDeleteTrip(uid, tripId);
  }, [uid]);

  // ─── City Points / XP ─────────────────────────────────────────────────────
  const addXp = useCallback(async (xpGained: number, county: string, district: string) => {
    if (xpGained <= 0 || !county || !district) return;
    const key = `${county}-${district}`;
    setGameData(prev => {
      const updated = { ...prev, cityPoints: { ...prev.cityPoints, [key]: (prev.cityPoints[key] || 0) + xpGained } };
      if (uid) saveGameData(uid, { cityPoints: updated.cityPoints });
      return updated;
    });
  }, [uid]);

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (settings: Settings) => {
    await partialSave({ settings });
  }, [partialSave]);

  // ─── Asked Questions ──────────────────────────────────────────────────────
  const updateAskedQuestions = useCallback(async (askedQuestions: AskedQuestionHistory) => {
    await partialSave({ askedQuestions });
  }, [partialSave]);

  // ─── Daily Stats & Streak ─────────────────────────────────────────────────
  const addDistanceToday = useCallback(async (km: number) => {
    const updated = computeAddDistance(gameData.dailyStats, km);
    await partialSave({ dailyStats: updated });
  }, [gameData.dailyStats, partialSave]);

  const recordWalkToday = useCallback(async () => {
    const updated = computeStreak(gameData.streak);
    await partialSave({ streak: updated });
  }, [gameData.streak, partialSave]);

  // ─── Trail Progress ───────────────────────────────────────────────────────
  const updateTrailProgress = useCallback(async (trailId: string, progress: TrailProgress) => {
    if (!uid) return;
    const newProgress = { ...trailProgress, [trailId]: progress };
    setTrailProgress(newProgress);
    setTrails(buildTrails(customTrails, newProgress));
    await saveTrailProgress(uid, trailId, progress);
  }, [uid, trailProgress, customTrails]);

  const addCustomTrail = useCallback(async (trail: Trail) => {
    if (!uid) return;
    const newCustom = [...customTrails, trail];
    setCustomTrails(newCustom);
    setTrails(buildTrails(newCustom, trailProgress));
    await saveCustomTrailDoc(uid, trail);
  }, [uid, customTrails, trailProgress]);

  const removeCustomTrail = useCallback(async (trailId: string) => {
    if (!uid) return;
    const newCustom = customTrails.filter(t => t.id !== trailId);
    setCustomTrails(newCustom);
    setTrails(buildTrails(newCustom, trailProgress));
    await deleteCustomTrailDoc(uid, trailId);
  }, [uid, customTrails, trailProgress]);

  // ─── API Counts ───────────────────────────────────────────────────────────
  const incrementPlacesCount = useCallback(async () => {
    const count = (gameData.placesApiCallCount || 0) + 1;
    await partialSave({ placesApiCallCount: count });
  }, [gameData.placesApiCallCount, partialSave]);

  const incrementGeminiCount = useCallback(async () => {
    const count = (gameData.geminiApiCallCount || 0) + 1;
    await partialSave({ geminiApiCallCount: count });
  }, [gameData.geminiApiCallCount, partialSave]);

  const resetApiCounts = useCallback(async () => {
    await partialSave({ placesApiCallCount: 0, geminiApiCallCount: 0 });
  }, [partialSave]);

  // ─── Nearby POIs Meta ─────────────────────────────────────────────────────
  const updateNearbyPoisMeta = useCallback(async (nearbyPoisMeta: GameData['nearbyPoisMeta']) => {
    await partialSave({ nearbyPoisMeta });
  }, [partialSave]);

  return (
    <GameContext.Provider value={{
      uid, isLoading, isAnonymous, googleEmail, linkWithGoogle, switchToGoogleAccount,
      pois: gameData.pois, updatePois,
      trips, addTrip, removeTrip,
      cityPoints: gameData.cityPoints, addXp,
      settings: gameData.settings, updateSettings,
      askedQuestions: gameData.askedQuestions, updateAskedQuestions,
      dailyStats: gameData.dailyStats, streak: gameData.streak,
      addDistanceToday, recordWalkToday,
      trails, updateTrailProgress, addCustomTrail, removeCustomTrail,
      placesApiCallCount: gameData.placesApiCallCount,
      geminiApiCallCount: gameData.geminiApiCallCount,
      incrementPlacesCount, incrementGeminiCount, resetApiCounts,
      nearbyPoisMeta: gameData.nearbyPoisMeta, updateNearbyPoisMeta,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within FirebaseGameProvider');
  return ctx;
}
