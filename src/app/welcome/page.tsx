
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Footprints, MapPin, Flame, Sparkles } from 'lucide-react';
import { loadDailyStats, loadStreak } from '@/lib/dailyStats';

export default function WelcomePage() {
  const router = useRouter();
  const [stats, setStats] = React.useState<{ distance: number; goalKm: number } | null>(null);
  const [streakCount, setStreakCount] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const s = loadDailyStats();
    setStats(s);
    setStreakCount(loadStreak().count);
  }, []);

  const progress = stats ? Math.min(1, stats.distance / stats.goalKm) : 0;
  const goalDone = progress >= 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-body text-foreground">
      <div className="relative mx-auto flex h-auto max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-primary/50 bg-background shadow-2xl shadow-primary/20">
        <div className="overflow-y-auto p-6 space-y-5">

          {/* Hero */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-block rounded-full bg-primary/20 p-4 text-primary">
              <Sparkles className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-primary">AI 城市探索</h1>
            <p className="text-sm text-muted-foreground">每次出門，都是一場探險</p>
          </div>

          {/* Daily status card — shows after first day */}
          {isClient && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">今日狀態</p>

              {/* Goal ring + text */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <svg width="60" height="60" className="-rotate-90">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                    <circle
                      cx="30" cy="30" r="24" fill="none"
                      stroke={goalDone ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
                      strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 24 * progress} ${2 * Math.PI * 24}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Footprints className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <div className="flex-1">
                  {stats ? (
                    <>
                      <p className="font-bold text-foreground">
                        {goalDone ? '今日目標達成 ✅' : `今日目標 ${stats.goalKm} km`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        已走 {stats.distance.toFixed(2)} km
                        {!goalDone && ` / 還差 ${Math.max(0, stats.goalKm - stats.distance).toFixed(1)} km`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">今天還沒開始走！</p>
                  )}
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <Flame className={streakCount > 0 ? 'h-4 w-4 text-orange-400' : 'h-4 w-4 text-muted-foreground'} />
                <span className="text-sm font-semibold text-foreground">{streakCount} 天連線</span>
                {streakCount >= 7 && <span className="text-xs text-orange-400">🔥 你好猛！</span>}
                <MapPin className="h-4 w-4 text-primary ml-auto" />
                <span className="text-xs text-muted-foreground">出門開始追蹤</span>
              </div>
            </div>
          )}

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['🗺️ 戰爭迷霧地圖', '🐾 探索夥伴', '🏆 成就系統', '🤖 AI 導遊', '🍜 附近美食', '📍 地點解鎖'].map(f => (
              <span key={f} className="text-xs bg-muted/60 text-muted-foreground rounded-full px-3 py-1">{f}</span>
            ))}
          </div>

          <Button onClick={() => router.push('/map')} size="lg" className="w-full text-base font-bold">
            {goalDone ? '繼續探索 🎉' : '出發！'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
