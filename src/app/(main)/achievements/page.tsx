
'use client';

import * as React from 'react';
import { Gem, MapPin, Compass, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CityPoints, Title } from '@/lib/types';
import { TitleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  };
};

export default function AchievementsPage() {
  const [progress, setProgress] = React.useState<ProgressStats>({});
  const [visitedCounties, setVisitedCounties] = React.useState<string[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  const loadPoints = React.useCallback(() => {
    const savedCityPoints = localStorage.getItem('cityPoints');
    const cityPoints: CityPoints = savedCityPoints ? JSON.parse(savedCityPoints) : {};
    
    const discoveredCounties = Object.keys(cityPoints).filter(county => (cityPoints[county] || 0) > 0);
    setVisitedCounties(discoveredCounties.sort()); // Sort for consistent order

    const stats: ProgressStats = discoveredCounties.reduce((acc, county) => {
      const points = cityPoints[county] || 0;
      const level = Math.floor(points / POINTS_PER_LEVEL);
      const title = getTitleForLevel(level);

      acc[county] = {
        points,
        level: level + 1, // Display level as 1-based
        title,
      };
      return acc;
    }, {} as ProgressStats);

    setProgress(stats);
  }, []);

  React.useEffect(() => {
    setIsClient(true);
    loadPoints();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'cityPoints') {
            loadPoints();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const intervalId = setInterval(loadPoints, 1000); 

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
    };

  }, [loadPoints]);
  
  const handleClearAllProgress = () => {
    localStorage.removeItem('cityPoints');
    loadPoints(); // Refresh the UI
  };


  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <Gem className="h-6 w-6" />
          <h2>探索成就</h2>
        </div>
        {visitedCounties.length > 0 && (
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 />
                  重設所有進度
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要重設所有進度嗎？</AlertDialogTitle>
                  <AlertDialogDescription>
                    這個操作無法復原。這將會永久刪除您在所有城市的經驗值和等級。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllProgress} className="bg-destructive hover:bg-destructive/90">
                    確認重設
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        )}
      </header>
      
      {visitedCounties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visitedCounties.map(county => {
            const countyProgress = progress[county];
            
            if (!countyProgress) return null;

            return (
              <Card key={county}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span>{county}</span>
                    </div>
                     <Badge variant="outline" className="gap-2 border-accent text-accent">
                        <TitleIcon title={countyProgress.title.name} className="w-4 h-4"/>
                        {countyProgress.title.name}
                     </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-4 pt-2">
                      <span className="font-bold text-lg text-primary">Lvl {countyProgress.level}</span>
                      <span className="text-sm font-bold text-foreground/80">{countyProgress.points} XP</span>
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
