'use client';

import * as React from 'react';
import { MapPin, Compass, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemActionBar } from '@/components/ItemActionBar';
import { useGame } from '@/context/FirebaseGameContext';
import { useLocation } from '@/context/LocationTrackingContext';

const PAGE_SIZE = 20;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatLastVisit(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 30) return `${diffDays} 天前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

export default function PoisPage() {
  const game = useGame();
  const { position } = useLocation();
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Sort all POIs by distance from user
  const sorted = React.useMemo(() => {
    const pois = [...game.pois];
    if (position) {
      pois.sort((a, b) =>
        haversineKm(position.lat, position.lng, a.position.lat, a.position.lng) -
        haversineKm(position.lat, position.lng, b.position.lat, b.position.lng)
      );
    }
    return pois;
  }, [game.pois, position]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  // Infinite scroll via IntersectionObserver
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setVisibleCount(n => n + PAGE_SIZE);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore]);

  if (game.isLoading) {
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

  const totalVisits = game.pois.reduce((s, p) => s + (p.visitCount ?? 0), 0);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <MapPin className="h-6 w-6" />
          <h2>探索地點</h2>
        </div>
        <Badge variant="secondary">
          {game.pois.filter(p => (p.visitCount ?? 0) > 0).length} 地點 · {totalVisits} 次造訪
        </Badge>
      </header>

      {sorted.length === 0 ? (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Compass className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-xl font-bold mt-4">前往地圖分頁</h3>
          <p className="text-muted-foreground mt-2 text-sm">開啟地圖後會自動載入附近景點</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            共 {sorted.length} 個地點{position ? '，依距離由近到遠' : ''}
          </p>

          <div className="space-y-2">
            {visible.map(poi => {
              const dist = position
                ? haversineKm(position.lat, position.lng, poi.position.lat, poi.position.lng)
                : null;
              const visited = (poi.visitCount ?? 0) > 0;

              return (
                <Card key={poi.id} className={visited ? 'border-amber-500/30 bg-amber-500/5' : ''}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="flex-1 min-w-0 truncate">{poi.name}</span>
                      {visited && (
                        <span className="shrink-0 flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-full px-2 py-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          {poi.visitCount}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{poi.areaDescription}</p>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {poi.district && (
                          <span className="text-xs text-muted-foreground/60">{poi.county} {poi.district}</span>
                        )}
                        {dist != null && (
                          <span className="text-xs text-blue-400">📍 {formatDist(dist)}</span>
                        )}
                      </div>
                      {poi.lastVisitedAt && (
                        <span className="text-xs text-muted-foreground/50 shrink-0">
                          最近：{formatLastVisit(poi.lastVisitedAt)}
                        </span>
                      )}
                    </div>
                    <ItemActionBar name={poi.name} lat={poi.position.lat} lng={poi.position.lng} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-8 flex items-center justify-center">
            {hasMore && <p className="text-xs text-muted-foreground">載入更多…</p>}
          </div>
        </>
      )}
    </div>
  );
}
