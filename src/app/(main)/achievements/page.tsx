
'use client';

import * as React from 'react';
import { Gem, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CityPoints, Title } from '@/lib/types';
import { TitleIcon } from '@/components/icons';

const taiwanCounties = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '基隆市', '新竹市',
  '嘉義市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣',
  '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'
];

const TITLES: Title[] = [
    { levelThreshold: 0, name: '新手探險家', icon: 'Feather' },
    { levelThreshold: 5, name: '城市漫遊者', icon: 'Footprints' },
    { levelThreshold: 10, name: '區域專家', icon: 'Landmark' },
    { levelThreshold: 15, name: '博學大師', icon: 'Flame' },
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
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    // Function to load points, can be reused.
    const loadPoints = () => {
        const savedCityPoints = localStorage.getItem('cityPoints');
        const cityPoints: CityPoints = savedCityPoints ? JSON.parse(savedCityPoints) : {};
        
        const stats: ProgressStats = taiwanCounties.reduce((acc, county) => {
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
    };
    
    loadPoints();

    // Listen for storage changes from other tabs, though less critical for this app.
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'cityPoints') {
            loadPoints();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // An interval to refresh from localStorage to catch updates from the same tab,
    // as 'storage' event doesn't fire for same-tab changes.
    const intervalId = setInterval(loadPoints, 1000); // Refresh every second

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
    };

  }, []);

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <Gem className="h-6 w-6" />
        <h2>探索成就</h2>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {taiwanCounties.map(county => {
          const countyProgress = progress[county] || { 
              points: 0, 
              level: 1, 
              title: TITLES[0],
          };
          
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
    </div>
  );
}
