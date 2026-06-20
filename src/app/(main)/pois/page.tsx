'use client';

import * as React from 'react';
import { MapPin, Compass, Star } from 'lucide-react';
import type { PoiType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemActionBar } from '@/components/ItemActionBar';
import { useGame } from '@/context/FirebaseGameContext';

const POI_EMOJI: Record<PoiType, string> = {
  trailhead: '⛺', summit: '🏔️', waterfall: '💧',
  viewpoint: '👁️', temple: '🏛️', general: '🏛',
};

const POI_CATEGORY: Record<PoiType, string> = {
  trailhead: '登山口', summit: '山頂/三角點', waterfall: '瀑布',
  viewpoint: '觀景台', temple: '廟宇', general: '旅遊景點',
};

const HIKE_TYPES: PoiType[] = ['trailhead', 'summit', 'waterfall', 'viewpoint'];

function formatLastVisit(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 30) return `${diffDays} 天前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

export default function PoisPage() {
  const game = useGame();
  const [tab, setTab] = React.useState<'all' | 'hike' | 'tourism'>('all');

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

  const filtered = tab === 'hike'
    ? game.pois.filter(p => HIKE_TYPES.includes(p.poiType ?? 'general'))
    : tab === 'tourism'
    ? game.pois.filter(p => !HIKE_TYPES.includes(p.poiType ?? 'general'))
    : game.pois;

  const visited = filtered.filter(p => (p.visitCount ?? 0) > 0)
    .sort((a, b) => (b.visitCount ?? 0) - (a.visitCount ?? 0));
  const notYet = filtered.filter(p => !(p.visitCount ?? 0));

  const totalVisits = visited.reduce((sum, p) => sum + (p.visitCount ?? 0), 0);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <MapPin className="h-6 w-6" />
          <h2>探索地點</h2>
        </div>
        <Badge variant="secondary">
          {visited.length} 地點 · 共 {totalVisits} 次造訪
        </Badge>
      </header>

      {/* Category tabs */}
      <div className="flex gap-2">
        {([['all', '全部'], ['hike', '⛰️ 郊山步道'], ['tourism', '🏛 旅遊景點']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              tab === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Visited section */}
      {visited.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            已造訪（{visited.length}）
          </h3>
          {visited.map(poi => (
            <Card key={poi.id} className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-lg shrink-0">{POI_EMOJI[poi.poiType ?? 'general']}</span>
                  <span className="flex-1 min-w-0 truncate">{poi.name}</span>
                  {/* Visit count badge */}
                  <span className="shrink-0 flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-full px-2 py-0.5">
                    <Star className="h-3 w-3 fill-current" />
                    {poi.visitCount} 次
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                <p className="text-sm text-muted-foreground line-clamp-2">{poi.areaDescription}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {POI_CATEGORY[poi.poiType ?? 'general']}
                    </Badge>
                    {poi.district && (
                      <span className="text-xs text-muted-foreground/60">{poi.county} {poi.district}</span>
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
          ))}
        </section>
      )}

      {/* Not yet visited section */}
      {notYet.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            尚未造訪（{notYet.length}）
          </h3>
          {notYet.map(poi => (
            <Card key={poi.id}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-lg shrink-0 opacity-60">{POI_EMOJI[poi.poiType ?? 'general']}</span>
                  <span className="flex-1 min-w-0 truncate">{poi.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs shrink-0">
                    {POI_CATEGORY[poi.poiType ?? 'general']}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{poi.areaDescription}</p>
                {poi.district && (
                  <p className="text-xs text-muted-foreground/60 mt-1">{poi.county} {poi.district}</p>
                )}
                <ItemActionBar name={poi.name} lat={poi.position.lat} lng={poi.position.lng} />
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Compass className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-xl font-bold mt-4">前往地圖分頁</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            開啟地圖後會自動載入附近景點與步道
          </p>
        </div>
      )}
    </div>
  );
}
