
'use client';

import * as React from 'react';
import { Gem, MapPin, Compass, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { CityPoints, Title } from '@/lib/types';
import { TitleIcon } from '@/components/icons';
import { TitleBadge } from '@/components/TitleBadge';
import { VirtualPet } from '@/components/VirtualPet';
import { loadStreak, type Streak } from '@/lib/dailyStats';

const TITLES: Title[] = [
    { levelThreshold: 0, name: '新手探險家', icon: 'Feather' },
    { levelThreshold: 5, name: '城市漫遊者', icon: 'Footprints' },
    { levelThreshold: 10, name: '區域專家', icon: 'Landmark' },
    { levelThreshold: 15, name: '專業導遊', icon: 'Flame' },
    { levelThreshold: 20, name: '金牌專業導覽員', icon: 'Crown' },
];

const POINTS_PER_LEVEL = 100;

const getTitleForLevel = (level: number): Title => {
  return TITLES.slice().reverse().find(t => level >= t.levelThreshold) || TITLES[0];
};

type ProgressStats = {
  [key: string]: {
    points: number;
    level: number;
    title: Title;
    county: string;
    district: string;
  };
};

export default function AchievementsPage() {
  const [progress, setProgress] = React.useState<ProgressStats>({});
  const [visitedDistricts, setVisitedDistricts] = React.useState<string[]>([]);
  const [streak, setStreak] = React.useState<Streak>({ lastWalkDate: '', count: 0 });
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setStreak(loadStreak());

    const loadPoints = () => {
      const savedCityPoints = localStorage.getItem('cityPoints');
      // Gracefully handle the case where no points are saved yet.
      if (!savedCityPoints) {
        setProgress({});
        setVisitedDistricts([]);
        return;
      }

      try {
          const cityPoints: CityPoints = JSON.parse(savedCityPoints);
          const discoveredDistricts = Object.keys(cityPoints).filter(key => (cityPoints[key] || 0) > 0);
          
          const stats: ProgressStats = discoveredDistricts.reduce((acc, key) => {
            const points = cityPoints[key] || 0;
            const level = Math.floor(points / POINTS_PER_LEVEL);
            const title = getTitleForLevel(level);
            const [county, district] = key.split('-');

            if (county && district) {
              acc[key] = {
                points,
                level: level,
                title,
                county,
                district
              };
            }
            return acc;
          }, {} as ProgressStats);
          
          setVisitedDistricts(Object.keys(stats).sort());
          setProgress(stats);
      } catch (e) {
          console.error("Failed to parse cityPoints from localStorage", e);
          // If parsing fails, clear the corrupted data and reset state.
          localStorage.removeItem('cityPoints');
          setProgress({});
          setVisitedDistricts([]);
      }
    };

    loadPoints();

    // Listen for changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
        // If cityPoints changed, or if all local storage was cleared, reload points.
        if (e.key === 'cityPoints' || e.key === null) { 
            loadPoints();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup listener on component unmount
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  if (!isClient) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
                <Gem className="h-6 w-6" />
                <h2>探索成就</h2>
            </div>
             <div className="text-center p-8 bg-muted/50 rounded-lg">
                <Compass className="w-16 h-16 mx-auto text-accent animate-pulse" />
                <h3 className="text-2xl font-bold mt-4">讀取中...</h3>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <Gem className="h-6 w-6" />
          <h2>探索成就</h2>
        </div>
      </header>

      <VirtualPet />

      <Card className={streak.count > 0 ? 'border-orange-400/50 bg-orange-400/5' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className={streak.count > 0 ? 'text-orange-400 h-5 w-5' : 'text-muted-foreground h-5 w-5'} />
            連續出門天數
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{streak.count}</span>
            <span className="text-muted-foreground">天</span>
            {streak.count >= 7 && <span className="text-sm text-orange-400 font-semibold ml-1">🔥 持續燃燒！</span>}
            {streak.count >= 30 && <span className="text-sm text-amber-500 font-semibold ml-1">👑 傳說等級</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {streak.count === 0
              ? '今天出門走走，開始你的連線！'
              : streak.count === 1
              ? '好的開始！明天繼續保持 🌱'
              : `已連續 ${streak.count} 天出門探索，繼續加油！`
            }
          </p>
        </CardContent>
      </Card>
      
      {visitedDistricts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visitedDistricts.map(key => {
            const districtProgress = progress[key];
            
            if (!districtProgress) return null;

            return (
              <Card key={key}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span>{districtProgress.county} {districtProgress.district}</span>
                    </div>
                     <TitleBadge title={districtProgress.title.name} />
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-4 pt-2">
                      <span className="font-bold text-lg text-primary">Lvl {districtProgress.level}</span>
                      <span className="text-sm font-bold text-foreground/80">{districtProgress.points} XP</span>
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Compass className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">尚未解鎖任何成就</h3>
          <p className="text-muted-foreground mt-2">到「地圖」分頁開始探索，在您造訪的城市累積經驗值吧！</p>
        </div>
      )}
    </div>
  );
}
