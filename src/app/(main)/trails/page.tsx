'use client';

import * as React from 'react';
import {
  Mountain, Upload, Trash2, CheckCircle2, Circle,
  Navigation, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ItemActionBar } from '@/components/ItemActionBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { parseGpx } from '@/lib/gpxParser';
import { useGame } from '@/context/FirebaseGameContext';
import type { Trail, TrailDifficulty, PoiType } from '@/lib/types';

const isSeedTrail = (id: string) => id.startsWith('seed-') || id.startsWith('osm-');

const DIFFICULTY_LABEL: Record<TrailDifficulty, { text: string; color: string }> = {
  easy:     { text: '輕鬆', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  moderate: { text: '普通', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  hard:     { text: '困難', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  expert:   { text: '挑戰', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const DIFFICULTY_ORDER: TrailDifficulty[] = ['easy', 'moderate', 'hard', 'expert'];

const POI_EMOJI: Record<PoiType, string> = {
  trailhead: '⛺', summit: '🏔️', waterfall: '💧',
  viewpoint: '👁️', temple: '🏛️', general: '📍',
};

function openGoogleMapsNav(lat: number, lng: number, name?: string) {
  const dest = `${lat},${lng}`;
  const label = name ? encodeURIComponent(name) : '';
  // Opens Google Maps app on mobile, browser on desktop
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=&travelmode=driving${label ? `&destination=${label}` : ''}`;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
}

type FilterTab = 'all' | TrailDifficulty;

export default function TrailsPage() {
  const game = useGame();
  const trails = game.trails;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [filterTab, setFilterTab] = React.useState<FilterTab>('all');
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
      for (const trail of newTrails) {
        await game.addCustomTrail(trail);
      }
      toast({ title: `已匯入 ${newTrails.length} 條步道`, description: newTrails.map(t => t.name).join('、') });
    }
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (isSeedTrail(id)) return;
    if (!confirm('確定要刪除這條步道嗎？')) return;
    await game.removeCustomTrail(id);
  };

  if (game.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center py-16">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  const filtered = filterTab === 'all' ? trails : trails.filter(t => t.difficulty === filterTab);

  // Stats
  const completedCount = trails.filter(t => t.completionPercent >= 100).length;
  const totalKm = trails.reduce((s, t) => s + t.walkedDistanceKm, 0);

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

      {/* Filter tabs */}
      {trails.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
              filterTab === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            全部 ({trails.length})
          </button>
          {DIFFICULTY_ORDER.map(d => {
            const cnt = trails.filter(t => t.difficulty === d).length;
            if (cnt === 0) return null;
            const style = DIFFICULTY_LABEL[d];
            return (
              <button
                key={d}
                onClick={() => setFilterTab(d)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                  filterTab === d
                    ? `${style.color} border-current`
                    : 'text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                {style.text} ({cnt})
              </button>
            );
          })}
        </div>
      )}

      {/* Trail list */}
      {filtered.length === 0 && trails.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Mountain className="h-16 w-16 mx-auto text-muted-foreground/40" />
          <p className="text-lg font-semibold text-muted-foreground">尚無步道</p>
          <p className="text-sm text-muted-foreground">從健行筆記下載 GPX 後點選「匯入 GPX」</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />選擇 GPX 檔案
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(trail => {
            const diff = DIFFICULTY_LABEL[trail.difficulty];
            const done = trail.completionPercent >= 100;
            const isExpanded = expandedId === trail.id;
            const trailhead = trail.waypoints.find(w => w.poiType === 'trailhead') ?? trail.waypoints[0];

            return (
              <Card
                key={trail.id}
                className={done ? 'border-green-500/40 bg-green-500/5' : ''}
              >
                {/* Main row — tap to expand */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : trail.id)}
                >
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
                          <Badge variant="outline" className="text-xs">↑{trail.elevationGainM} m</Badge>
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                    </div>
                  </CardHeader>

                  {/* Progress bar — always visible */}
                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>完成度 {trail.completionPercent}%</span>
                      <span>{trail.walkedDistanceKm.toFixed(1)} / {trail.totalDistanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${trail.completionPercent}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">

                    {/* Navigate to trailhead */}
                    {trailhead && (
                      <Button
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => openGoogleMapsNav(
                          trailhead.position.lat,
                          trailhead.position.lng,
                          `${trail.name} 登山口`
                        )}
                      >
                        <Navigation className="h-4 w-4" />
                        Google Maps 導航前往登山口
                      </Button>
                    )}

                    {/* Three action buttons */}
                    {trailhead && (
                      <ItemActionBar
                        name={trail.name}
                        lat={trailhead.position.lat}
                        lng={trailhead.position.lng}
                        searchQuery={trail.name + ' 步道 台灣'}
                      />
                    )}

                    {/* Waypoints */}
                    {trail.waypoints.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">地標</p>
                        {trail.waypoints.map(wpt => (
                          <div
                            key={wpt.id}
                            className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/40"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{POI_EMOJI[wpt.poiType]}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-tight truncate">{wpt.name}</p>
                                {wpt.elevation && (
                                  <p className="text-xs text-muted-foreground">{wpt.elevation} m</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => openGoogleMapsNav(wpt.position.lat, wpt.position.lng, wpt.name)}
                              className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              title={`導航至 ${wpt.name}`}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              導航
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delete — only for custom trails */}
                    {!isSeedTrail(trail.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive gap-1.5 mt-1"
                        onClick={() => handleDelete(trail.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        刪除此步道
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
