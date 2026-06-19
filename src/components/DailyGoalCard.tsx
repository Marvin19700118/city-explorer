
'use client';

import * as React from 'react';
import { Flame, Footprints, Target } from 'lucide-react';
import { loadDailyStats, loadStreak, type DailyStats, type Streak } from '@/lib/dailyStats';
import { cn } from '@/lib/utils';

type Props = {
  // Called from parent when trip is stopped so we can refresh
  refreshTrigger?: number;
};

export function DailyGoalCard({ refreshTrigger }: Props) {
  const [stats, setStats] = React.useState<DailyStats | null>(null);
  const [streak, setStreak] = React.useState<Streak | null>(null);

  const refresh = React.useCallback(() => {
    setStats(loadDailyStats());
    setStreak(loadStreak());
  }, []);

  React.useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

  React.useEffect(() => {
    refresh();
  }, [refreshTrigger, refresh]);

  if (!stats) return null;

  const progress = Math.min(1, stats.distance / stats.goalKm);
  const progressPct = Math.round(progress * 100);
  const done = progress >= 1;
  const remaining = Math.max(0, stats.goalKm - stats.distance).toFixed(1);

  // SVG ring
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b border-border">
      {/* Ring progress */}
      <div className="relative shrink-0">
        <svg width="56" height="56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          <circle
            cx="28" cy="28" r={r} fill="none"
            stroke={done ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
            strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done
            ? <span className="text-lg">✅</span>
            : <Footprints className="h-5 w-5 text-accent" />
          }
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold', done ? 'text-primary' : 'text-foreground')}>
          {done ? '今日目標達成！🎉' : `今日目標 ${stats.goalKm} km`}
        </p>
        <p className="text-xs text-muted-foreground">
          {done
            ? `已走 ${stats.distance.toFixed(2)} km`
            : `已走 ${stats.distance.toFixed(2)} km，還差 ${remaining} km`
          }
        </p>
        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-accent"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="shrink-0 flex flex-col items-center gap-0.5">
        <Flame className={cn('h-5 w-5', (streak?.count ?? 0) > 0 ? 'text-orange-400' : 'text-muted-foreground')} />
        <span className="text-xs font-bold text-foreground">{streak?.count ?? 0}</span>
        <span className="text-[10px] text-muted-foreground leading-none">天連線</span>
      </div>
    </div>
  );
}
