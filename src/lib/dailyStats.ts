
// Utilities for daily distance goals and walk streaks

export type DailyStats = {
  date: string; // ISO date string YYYY-MM-DD
  distance: number; // km walked today
  goalKm: number;
};

export type Streak = {
  lastWalkDate: string; // YYYY-MM-DD
  count: number;
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadDailyStats(): DailyStats {
  try {
    const raw = localStorage.getItem('dailyStats');
    if (raw) {
      const saved: DailyStats = JSON.parse(raw);
      if (saved.date === todayStr()) return saved;
    }
  } catch { /* ignore */ }
  return { date: todayStr(), distance: 0, goalKm: 2.0 };
}

export function saveDailyStats(stats: DailyStats): void {
  try {
    localStorage.setItem('dailyStats', JSON.stringify({ ...stats, date: todayStr() }));
  } catch { /* ignore */ }
}

export function addDistanceToday(km: number): DailyStats {
  const stats = loadDailyStats();
  const updated = { ...stats, distance: stats.distance + km };
  saveDailyStats(updated);
  return updated;
}

export function loadStreak(): Streak {
  try {
    const raw = localStorage.getItem('streak');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastWalkDate: '', count: 0 };
}

export function recordWalkToday(): Streak {
  const today = todayStr();
  const streak = loadStreak();

  if (streak.lastWalkDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newCount = streak.lastWalkDate === yesterdayStr ? streak.count + 1 : 1;
  const updated: Streak = { lastWalkDate: today, count: newCount };

  try {
    localStorage.setItem('streak', JSON.stringify(updated));
  } catch { /* ignore */ }
  return updated;
}
