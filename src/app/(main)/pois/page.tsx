
'use client';

import * as React from 'react';
import { MapPin, Lock, Compass, Star } from 'lucide-react';
import type { PointOfInterest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const INITIAL_POIS: PointOfInterest[] = [
  { id: 'poi1', name: '台北101', position: { lat: 25.0339, lng: 121.5645 }, areaDescription: '一座位於台灣台北市信義區的摩天大樓。樓高509.2公尺，地上101層、地下5層，由李祖原聯合建築師事務所設計，於2004年完工開幕。', discovered: false, county: '台北市', district: '信義區' },
  { id: 'poi2', name: '國立故宮博物院', position: { lat: 25.1026, lng: 121.5485 }, areaDescription: '位於台灣台北市士林區，為台灣最具規模的博物館，也是古代中國藝術史與漢學研究機構，館舍在1965年落成。', discovered: false, county: '台北市', district: '士林區' },
  { id: 'poi3', name: '中正紀念堂', position: { lat: 25.0345, lng: 121.5218 }, areaDescription: '為紀念中華民國第一任總統蔣中正而興建，是位於臺灣臺北市中正區的國家紀念建築，全區250,000平方公尺。', discovered: false, county: '台北市', district: '中正區' },
  { id: 'poi4', name: '西門町', position: { lat: 25.0479, lng: 121.5074 }, areaDescription: '位於臺灣臺北市萬華區，為臺北市西區最重要且國際化程度最高的消費商圈，以年輕族群為主要消費對象。', discovered: false, county: '台北市', district: '萬華區' },
];

export default function PoisPage() {
  const [pois, setPois] = React.useState<PointOfInterest[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem('pois');
      setPois(saved ? JSON.parse(saved) : INITIAL_POIS);
    } catch {
      setPois(INITIAL_POIS);
    }
  }, []);

  if (!isClient) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <MapPin className="h-6 w-6" />
          <h2>探索地點</h2>
        </div>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  const discovered = pois.filter(p => p.discovered);
  const undiscovered = pois.filter(p => !p.discovered);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <MapPin className="h-6 w-6" />
          <h2>探索地點</h2>
        </div>
        <Badge variant="secondary">{discovered.length} / {pois.length} 已解鎖</Badge>
      </header>

      {discovered.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">已探索</h3>
          {discovered.map(poi => (
            <Card key={poi.id} className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary shrink-0" />
                  <span>{poi.name}</span>
                  <Badge className="ml-auto text-xs shrink-0">{poi.district}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{poi.areaDescription}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {undiscovered.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">未探索</h3>
          {undiscovered.map(poi => (
            <Card key={poi.id} className="opacity-60">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>???</span>
                  <Badge variant="outline" className="ml-auto text-xs shrink-0">{poi.district}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm text-muted-foreground">前往該地點以解鎖</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {pois.length === 0 && (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Compass className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">尚無地點資料</h3>
          <p className="text-muted-foreground mt-2">前往地圖分頁開始探索吧！</p>
        </div>
      )}
    </div>
  );
}
