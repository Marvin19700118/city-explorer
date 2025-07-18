'use client';

import * as React from 'react';
import { BarChart2, Map, Compass, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PointOfInterest, Trip } from '@/lib/types';
import { StatsDisplay } from '@/components/StatsDisplay';

export default function StatsPage() {
  const [poiStats, setPoiStats] = React.useState<{ discovered: number; total: number }>({ discovered: 0, total: 0 });
  const [tripStats, setTripStats] = React.useState<{ totalDistance: number; totalTrips: number }>({ totalDistance: 0, totalTrips: 0 });
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    // Load POIs from localStorage
    const savedPois = localStorage.getItem('pois');
    if (savedPois) {
      const pois: PointOfInterest[] = JSON.parse(savedPois);
      const discoveredCount = pois.filter(p => p.discovered).length;
      setPoiStats({ discovered: discoveredCount, total: pois.length });
    }

    // Load Trips from localStorage
    const savedTrips = localStorage.getItem('trips');
    if (savedTrips) {
      const trips: Trip[] = JSON.parse(savedTrips);
      const totalDistance = trips.reduce((acc, trip) => acc + trip.distance, 0);
      setTripStats({ totalDistance, totalTrips: trips.length });
    }
  }, []);

  if (!isClient) {
    // Render a skeleton or loading state on the server
    return (
        <div className="p-4 space-y-6">
            <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
                <BarChart2 className="h-6 w-6" />
                <h2>您的統計資料</h2>
            </header>
            <div className="text-center p-8 bg-muted/50 rounded-lg">
                <p>正在載入統計資料...</p>
            </div>
        </div>
    );
  }

  const explorationPercentage = poiStats.total > 0 ? (poiStats.discovered / poiStats.total) * 100 : 0;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <BarChart2 className="h-6 w-6" />
        <h2>您的統計資料</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-accent">
            <Map className="h-5 w-5" />
            城市探索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatsDisplay 
            percentage={explorationPercentage} 
            label="台北市"
            value={poiStats.discovered}
            total={poiStats.total}
            unit="個景點已探索"
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <Compass className="h-5 w-5" />
                總距離
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline text-primary">{tripStats.totalDistance.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">公里</p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5" />
                已完成旅程
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-3xl font-bold font-headline text-primary">{tripStats.totalTrips}</p>
             <p className="text-sm text-muted-foreground">次冒險</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
