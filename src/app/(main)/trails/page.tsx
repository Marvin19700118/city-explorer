'use client';

import * as React from 'react';
import {
  Mountain, Upload, Trash2, CheckCircle2, Circle,
  Navigation, MapPin, ChevronDown, ChevronUp, Footprints, Map as MapIcon,
} from 'lucide-react';
import { ItemActionBar } from '@/components/ItemActionBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { parseGpx } from '@/lib/gpxParser';
import { useGame } from '@/context/FirebaseGameContext';
import type { Trail, TrailDifficulty, PoiType } from '@/lib/types';
import Link from 'next/link';

const isSeedTrail   = (id: string) => id.startsWith('seed-') || id.startsWith('osm-');
const isWalkRecord  = (id: string) => id.startsWith('walk-');

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

function openGoogleMapsNav(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
}

// ─── Single trail card ────────────────────────────────────────────────────────

function TrailCard({
  trail,
  expandedId,
  setExpandedId,
  onDelete,
  deletable,
}: {
  trail: Trail;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDelete: (id: string) => void;
  deletable: boolean;
}) {
  const diff = DIFFICULTY_LABEL[trail.difficulty];
  const done = trail.completionPercent >= 100;
  const isExpanded = expandedId === trail.id;
  const trailhead = trail.waypoints.find(w => w.poiType === 'trailhead') ?? trail.waypoints[0];
  const firstPoint = trail.points[0];

  return (
    <Card className={done ? 'border-green-500/40 bg-green-500/5' : ''}>
      <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : trail.id)}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              {done
                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                : <Circle className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-snug pr-2">{trail.name}</CardTitle>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant="outline" className={`text-xs ${diff.color}`}>{diff.text}</Badge>
                <Badge variant="outline" className="text-xs">{trail.totalDistanceKm.toFixed(1)} km</Badge>
                {trail.elevationGainM > 0 && (
                  <Badge variant="outline" className="text-xs">↑{trail.elevationGainM} m</Badge>
                )}
              </div>
            </div>
            {isExpanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
          </div>
        </CardHeader>
        <div className="px-4 pb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>完成度 {trail.completionPercent}%</span>
            <span>{trail.walkedDistanceKm.toFixed(1)} / {trail.totalDistanceKm.toFixed(1)} km</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${trail.completionPercent}%` }} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
          {(trailhead || firstPoint) && (
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const pt = trailhead?.position ?? firstPoint;
                openGoogleMapsNav(pt.lat, pt.lng);
              }}
            >
              <Navigation className="h-4 w-4" />
              Google Maps 導航前往起點
            </Button>
          )}

          {trailhead && (
            <ItemActionBar
              name={trail.name}
              lat={trailhead.position.lat}
              lng={trailhead.position.lng}
              searchQuery={trail.name + ' 步道 台灣'}
            />
          )}

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
                    onClick={() => openGoogleMapsNav(wpt.position.lat, wpt.position.lng)}
                    className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5" />導航
                  </button>
                </div>
              ))}
            </div>
          )}

          {deletable && (
            <div className="space-y-1 mt-1">
              <Link href="/map" className="block">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <MapIcon className="h-3.5 w-3.5" />在地圖查看軌跡
                </Button>
              </Link>
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

export default function TrailsPage() {
  const game = useGame();
  const trails = game.trails;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  if (game.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center py-16">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  const seedTrails     = trails.filter(t => isSeedTrail(t.id));
  const walkRecords    = trails.filter(t => isWalkRecord(t.id));
  const importedTrails = trails.filter(t => !isSeedTrail(t.id) && !isWalkRecord(t.id));

  const totalKm = trails.reduce((s, t) => s + t.walkedDistanceKm, 0);
  const completedCount = trails.filter(t => t.completionPercent >= 100).length;

  const cardProps = (deletable: boolean) => ({
    expandedId,
    setExpandedId,
    onDelete: handleDelete,
    deletable,
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

      {trails.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Mountain className="h-16 w-16 mx-auto text-muted-foreground/40" />
          <p className="text-lg font-semibold text-muted-foreground">尚無步道</p>
          <p className="text-sm text-muted-foreground">從健行筆記下載 GPX 後點選「匯入 GPX」，或到紀錄頁匯出散步紀錄</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />選擇 GPX 檔案
          </Button>
        </div>
      ) : (
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

          {/* 預設步道 */}
          {seedTrails.length > 0 && (
            <Section
              title="預設步道"
              icon={<Mountain className="h-4 w-4 text-green-400" />}
              count={seedTrails.length}
              defaultOpen={walkRecords.length === 0}
            >
              {seedTrails.map(trail => (
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
        </div>
      )}
    </div>
  );
}
