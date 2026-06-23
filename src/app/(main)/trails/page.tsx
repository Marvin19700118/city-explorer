'use client';

import * as React from 'react';
import {
  Mountain, Upload, Trash2, CheckCircle2,
  Navigation, MapPin, ChevronDown, ChevronUp, Footprints, Map as MapIcon, Search,
} from 'lucide-react';
import { ItemActionBar } from '@/components/ItemActionBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { parseGpx } from '@/lib/gpxParser';
import { useGame } from '@/context/FirebaseGameContext';
import { useLocation } from '@/context/LocationTrackingContext';
import type { Trail, TrailDifficulty, PoiType } from '@/lib/types';
import Link from 'next/link';

const isSeedTrail   = (id: string) => id.startsWith('seed-') || id.startsWith('osm-');
const isWalkRecord  = (id: string) => id.startsWith('walk-') || id.startsWith('rec-');

const DIFFICULTY_LABEL: Record<TrailDifficulty, { text: string; color: string }> = {
  easy:     { text: '輕鬆', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  moderate: { text: '普通', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  hard:     { text: '困難', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  expert:   { text: '挑戰', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const POI_EMOJI: Record<PoiType, string> = {
  trailhead: '⛺', summit: '🏔️', waterfall: '💧',
  viewpoint: '👁️', temple: '🏛️', general: '📍',
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function openGoogleMaps(trail: Trail) {
  const trailhead = trail.waypoints.find(w => w.poiType === 'trailhead') ?? trail.waypoints[0];
  if (trailhead) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${trailhead.position.lat},${trailhead.position.lng}&travelmode=driving`, '_blank');
  } else if (trail.googleMapsUrl) {
    window.open(trail.googleMapsUrl, '_blank');
  } else if (trail.points[0]) {
    const p = trail.points[0];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`, '_blank');
  }
}

// ─── Single trail card ────────────────────────────────────────────────────────

function TrailCard({
  trail,
  expandedId,
  setExpandedId,
  onDelete,
  deletable,
  userLat,
  userLng,
  onToggleComplete,
}: {
  trail: Trail;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDelete: (id: string) => void;
  deletable: boolean;
  userLat: number | null;
  userLng: number | null;
  onToggleComplete: (trail: Trail) => void;
}) {
  const diff = DIFFICULTY_LABEL[trail.difficulty];
  const done = trail.manuallyCompleted === true || trail.completionPercent >= 100;
  const isExpanded = expandedId === trail.id;
  const hasGpsTrack = trail.points.length > 1;

  const distFromUser = (userLat != null && userLng != null && trail.centerLat && trail.centerLng)
    ? haversineKm(userLat, userLng, trail.centerLat, trail.centerLng)
    : null;

  const navLat = trail.waypoints[0]?.position.lat ?? trail.centerLat;
  const navLng = trail.waypoints[0]?.position.lng ?? trail.centerLng;

  return (
    <Card className={done ? 'border-green-500/40 bg-green-500/5' : ''}>
      <div className="flex items-start gap-3 pt-3 px-4 pb-2">
        {/* Completion checkbox */}
        <button
          className="mt-0.5 shrink-0"
          onClick={e => { e.stopPropagation(); onToggleComplete(trail); }}
          title={done ? '取消完成' : '標記為已完成'}
        >
          <CheckCircle2 className={`h-5 w-5 transition-colors ${done ? 'text-green-500' : 'text-muted-foreground/30 hover:text-muted-foreground'}`} />
        </button>

        {/* Expand button */}
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpandedId(isExpanded ? null : trail.id)}>
          <CardTitle className={`text-base leading-snug ${done ? 'line-through text-muted-foreground' : ''}`}>{trail.name}</CardTitle>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge variant="outline" className={`text-xs ${diff.color}`}>{diff.text}</Badge>
            <Badge variant="outline" className="text-xs">{trail.totalDistanceKm.toFixed(1)} km</Badge>
            {trail.district && (
              <Badge variant="outline" className="text-xs text-muted-foreground">{trail.district.split(',')[0]}</Badge>
            )}
            {distFromUser != null && (
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                📍 {formatDist(distFromUser)}
              </Badge>
            )}
          </div>
        </button>

        <button onClick={() => setExpandedId(isExpanded ? null : trail.id)} className="shrink-0 mt-1">
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
          {/* Duration + trailType */}
          {(trail.duration || trail.trailType) && (
            <div className="flex gap-2 flex-wrap">
              {trail.trailType && <Badge variant="outline" className="text-xs">{trail.trailType}</Badge>}
              {trail.duration && <span className="text-xs text-muted-foreground">⏱ {trail.duration}</span>}
            </div>
          )}

          {/* Description */}
          {trail.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{trail.description}</p>
          )}

          {/* Entrance address */}
          {trail.entranceAddress && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-orange-400" />
              <span>入口：{trail.entranceAddress}</span>
            </div>
          )}

          {/* Navigation */}
          {(navLat && navLng) || trail.googleMapsUrl ? (
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => openGoogleMaps(trail)}
            >
              <Navigation className="h-4 w-4" />
              Google Maps 導航前往起點
            </Button>
          ) : null}

          {/* Action bar (網路搜尋, AI 簡介) */}
          {(navLat && navLng) ? (
            <ItemActionBar
              name={trail.name}
              lat={navLat}
              lng={navLng}
              searchQuery={trail.name + ' 步道 台灣'}
            />
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(trail.name + ' 步道')}`, '_blank')}
            >
              <Search className="h-4 w-4" />
              網路搜尋
            </Button>
          )}

          {/* Waypoints (for GPX-imported trails) */}
          {trail.waypoints.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">地標</p>
              {trail.waypoints.map(wpt => (
                <div key={wpt.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{POI_EMOJI[wpt.poiType]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{wpt.name}</p>
                      {wpt.elevation && <p className="text-xs text-muted-foreground">{wpt.elevation} m</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${wpt.position.lat},${wpt.position.lng}&travelmode=driving`, '_blank')}
                    className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5" />導航
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 健行筆記 */}
          {trail.hikingUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => window.open(trail.hikingUrl, '_blank')}
            >
              🥾 健行筆記步道頁面
            </Button>
          )}

          {/* GPS track controls */}
          {deletable && (
            <div className="space-y-1 mt-1">
              {hasGpsTrack && (
                <Link href={`/map?trail=${trail.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <MapIcon className="h-3.5 w-3.5" />在地圖查看軌跡
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost" size="sm"
                className="w-full text-destructive hover:text-destructive gap-1.5"
                onClick={() => onDelete(trail.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />刪除
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title, icon, count, children, defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 py-1 text-left"
      >
        {icon}
        <span className="font-bold text-sm text-foreground">{title}</span>
        <Badge variant="secondary" className="text-xs ml-1">{count}</Badge>
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const COUNTY_ORDER = [
  '臺北市','新北市','基隆市','桃園市','新竹市','新竹縣','苗栗縣',
  '臺中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣',
  '臺南市','高雄市','屏東縣','宜蘭縣','花蓮縣','臺東縣',
  '澎湖縣','金門縣','連江縣',
];

export default function TrailsPage() {
  const game = useGame();
  const { position } = useLocation();
  const trails = game.trails;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [countyFilter, setCountyFilter] = React.useState<string>('全部');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get counties that actually exist in seed data
  const availableCounties = React.useMemo(() => {
    const set = new Set(trails.filter(t => isSeedTrail(t.id)).map(t => t.county).filter(Boolean) as string[]);
    return COUNTY_ORDER.filter(c => set.has(c));
  }, [trails]);

  const userLat = position?.lat ?? null;
  const userLng = position?.lng ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newTrails: Trail[] = [];
    for (const file of files) {
      try {
        const text = await file.text();
        newTrails.push(parseGpx(text, file.name));
      } catch {
        toast({ title: `無法解析 ${file.name}`, variant: 'destructive' });
      }
    }
    if (newTrails.length > 0) {
      for (const trail of newTrails) await game.addCustomTrail(trail);
      toast({ title: `已匯入 ${newTrails.length} 條步道`, description: newTrails.map(t => t.name).join('、') });
    }
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除嗎？')) return;
    await game.removeCustomTrail(id);
  };

  const handleToggleComplete = async (trail: Trail) => {
    const nowDone = !(trail.manuallyCompleted === true || trail.completionPercent >= 100);
    await game.updateTrailProgress(trail.id, {
      walkedPoints: trail.walkedPoints,
      walkedDistanceKm: trail.walkedDistanceKm,
      completionPercent: nowDone ? 100 : 0,
      manuallyCompleted: nowDone,
    });
  };

  if (game.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center py-16">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  const isDone = (t: Trail) => t.manuallyCompleted === true || t.completionPercent >= 100;

  const completedTrails = trails.filter(isDone);
  const seedTrails      = trails.filter(t => isSeedTrail(t.id) && !isDone(t));
  const walkRecords     = trails.filter(t => isWalkRecord(t.id) && !isDone(t));
  const importedTrails  = trails.filter(t => !isSeedTrail(t.id) && !isWalkRecord(t.id) && !isDone(t));

  // Sort seed trails by distance from user
  const sortedSeedTrails = [...seedTrails].sort((a, b) => {
    if (userLat == null || userLng == null) return 0;
    const da = (a.centerLat && a.centerLng) ? haversineKm(userLat, userLng, a.centerLat, a.centerLng) : 99999;
    const db = (b.centerLat && b.centerLng) ? haversineKm(userLat, userLng, b.centerLat, b.centerLng) : 99999;
    return da - db;
  });

  // Filter by county then search
  const filteredSeed = sortedSeedTrails.filter(t => {
    const countyOk = countyFilter === '全部' || t.county === countyFilter || t.district?.includes(countyFilter);
    const searchOk = !search || t.name.includes(search) || t.district?.includes(search);
    return countyOk && searchOk;
  });

  const totalKm = trails.reduce((s, t) => s + t.walkedDistanceKm, 0);
  const completedCount = trails.filter(t => t.completionPercent >= 100).length;

  const cardProps = (deletable: boolean) => ({
    expandedId,
    setExpandedId,
    onDelete: handleDelete,
    deletable,
    userLat,
    userLng,
    onToggleComplete: handleToggleComplete,
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <Mountain className="h-6 w-6" />
          <h2>步道管理</h2>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-1.5 shrink-0">
          <Upload className="h-4 w-4" />
          匯入 GPX
        </Button>
        <input ref={fileInputRef} type="file" accept=".gpx" multiple className="hidden" onChange={handleFileChange} />
      </header>

      {/* Stats bar */}
      {trails.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-primary">{trails.length}</p>
            <p className="text-xs text-muted-foreground">步道</p>
          </div>
          <div className="bg-muted/50 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-green-400">{completedCount}</p>
            <p className="text-xs text-muted-foreground">已完成</p>
          </div>
          <div className="bg-muted/50 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-blue-400">{totalKm.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">已走 km</p>
          </div>
        </div>
      )}

      {/* County filter tabs */}
      {availableCounties.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-1.5 pb-1 w-max">
            {['全部', ...availableCounties].map(c => (
              <button
                key={c}
                onClick={() => setCountyFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                  countyFilter === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {seedTrails.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋步道名稱..."
            className="w-full rounded-lg border border-border bg-muted/30 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      <div className="space-y-5">
        {/* 我的散步紀錄 */}
        {walkRecords.length > 0 && (
          <Section
            title="我的散步紀錄"
            icon={<Footprints className="h-4 w-4 text-blue-400" />}
            count={walkRecords.length}
          >
            {walkRecords.map(trail => (
              <TrailCard key={trail.id} trail={trail} {...cardProps(true)} />
            ))}
          </Section>
        )}

        {/* 預設步道 (sorted by distance) */}
        {filteredSeed.length > 0 && (
          <Section
            title={userLat ? '預設步道（由近到遠）' : '預設步道'}
            icon={<Mountain className="h-4 w-4 text-green-400" />}
            count={filteredSeed.length}
            defaultOpen={walkRecords.length === 0}
          >
            {filteredSeed.map(trail => (
              <TrailCard key={trail.id} trail={trail} {...cardProps(false)} />
            ))}
          </Section>
        )}

        {/* 匯入步道 */}
        {importedTrails.length > 0 && (
          <Section
            title="匯入步道"
            icon={<Upload className="h-4 w-4 text-orange-400" />}
            count={importedTrails.length}
          >
            {importedTrails.map(trail => (
              <TrailCard key={trail.id} trail={trail} {...cardProps(true)} />
            ))}
          </Section>
        )}

        {search && filteredSeed.length === 0 && seedTrails.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            找不到符合「{search}」的步道
          </div>
        )}

        {/* 已完成步道 */}
        {completedTrails.length > 0 && (
          <Section
            title="已完成"
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            count={completedTrails.length}
            defaultOpen={false}
          >
            {completedTrails.map(trail => (
              <TrailCard key={trail.id} trail={trail} {...cardProps(isWalkRecord(trail.id) || (!isSeedTrail(trail.id)))} />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
