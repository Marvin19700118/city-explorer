
// Type definitions for daily distance goals and walk streaks.
// Persistence is handled by db.ts and FirebaseGameContext.

export type DailyStats = {
  date: string; // ISO date string YYYY-MM-DD
  distance: number; // km walked today
  goalKm: number;
};

export type Streak = {
  lastWalkDate: string; // YYYY-MM-DD
  count: number;
};
