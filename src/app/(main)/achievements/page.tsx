'use client';

import * as React from 'react';
import { Gem, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PointOfInterest, CityPoints } from '@/lib/types';

const taiwanCounties = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '基隆市', '新竹市',
  '嘉義市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣',
  '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'
];

type ProgressStats = {
  [key: string]: {
    discovered: number;
    total: number;
    points: number;
  };
};

const EXPERT_THRESHOLD = 50;

export default function AchievementsPage() {
  const [progress, setProgress] = React.useState<ProgressStats>({});
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const savedPois = localStorage.getItem('pois');
    const savedCityPoints = localStorage.getItem('cityPoints');
    
    const pois: PointOfInterest[] = savedPois ? JSON.parse(savedPois) : [];
    
    let cityPoints: CityPoints = savedCityPoints ? JSON.parse(savedCityPoints) : {};
    if (!savedCityPoints) {
      // Default Taipei to 53 points for demo/testing purposes
      cityPoints = { '台北市': 53 };
      localStorage.setItem('cityPoints', JSON.stringify(cityPoints));
    }
    
    const stats: ProgressStats = taiwanCounties.reduce((acc, county) => {
      const countyPois = pois.filter(p => p.county === county);
      const discoveredPois = countyPois.filter(p => p.discovered);
      
      acc[county] = {
        discovered: discoveredPois.length,
        total: countyPois.length,
        points: cityPoints[county] || 0,
      };
      return acc;
    }, {} as ProgressStats);

    setProgress(stats);
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
          const countyProgress = progress[county] || { discovered: 0, total: 0, points: 0 };
          const percentage = countyProgress.total > 0 ? (countyProgress.discovered / countyProgress.total) * 100 : 0;
          const isExpert = countyProgress.points >= EXPERT_THRESHOLD;
          
          return (
            <Card key={county}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    <span>{county}</span>
                    {isExpert && (
                      <Badge variant="default" className="bg-amber-500 text-white gap-1">
                        <Star className="w-3 h-3"/>
                        專家
                      </Badge>
                    )}
                  </div>
                   <span className="text-sm font-normal text-muted-foreground">
                    {countyProgress.points} / {EXPERT_THRESHOLD}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(countyProgress.points / EXPERT_THRESHOLD) * 100} className="h-2" />
                <p className="text-right text-xs text-muted-foreground mt-1">{Math.round((countyProgress.points / EXPERT_THRESHOLD) * 100)}%</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
