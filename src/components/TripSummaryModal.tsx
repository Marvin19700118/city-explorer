'use client';

import * as React from 'react';
import { Clock, Footprints, TrendingUp, MapPin, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LatLng, PointOfInterest } from '@/lib/types';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} 時 ${m} 分 ${s} 秒`;
  if (m > 0) return `${m} 分 ${s} 秒`;
  return `${s} 秒`;
}

function getDistKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function getPoisAlongRoute(path: LatLng[], pois: PointOfInterest[]): PointOfInterest[] {
  if (path.length === 0) return [];
  const RADIUS_KM = 0.3;
  return pois.filter(poi => {
    if (!poi.discovered) return false;
    return path.some(pt => getDistKm(poi.position, pt) < RADIUS_KM);
  });
}

export type TripDraft = {
  path: LatLng[];
  distance: number;
  elevationGain: number;
  durationSeconds: number;
  startTime: string;
  endTime: string;
};

interface Props {
  draft: TripDraft | null;
  pois: PointOfInterest[];
  onSave: (name: string, notes: string) => void;
  onCancel: () => void;
}

export function TripSummaryModal({ draft, pois, onSave, onCancel }: Props) {
  const defaultName = React.useMemo(() => {
    if (!draft) return '';
    const d = new Date(draft.startTime);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `散步紀錄 ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [draft]);

  const [name, setName] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (draft) {
      setName(defaultName);
      setNotes('');
    }
  }, [draft, defaultName]);

  if (!draft) return null;

  const steps = Math.round(draft.distance * 1320);
  const visitedPois = getPoisAlongRoute(draft.path, pois);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-background rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border shrink-0">
          <h2 className="font-bold text-lg text-primary">儲存此次紀錄</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">名稱</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="此次紀錄的名稱"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">備註</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="天氣、心情、特別的事…"
            />
          </div>

          {/* Stats */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">本次紀錄</p>
            <div className="grid grid-cols-2 gap-2">
              <StatBox icon={<Clock className="h-4 w-4 text-blue-400" />} label="時長" value={formatDuration(draft.durationSeconds)} />
              <StatBox icon={<Footprints className="h-4 w-4 text-green-400" />} label="距離" value={`${draft.distance.toFixed(2)} km`} />
              <StatBox icon={<TrendingUp className="h-4 w-4 text-orange-400" />} label="爬升" value={`${Math.round(draft.elevationGain)} m`} />
              <StatBox icon={<span className="text-base">👟</span>} label="估算步數" value={`~${steps.toLocaleString()} 步`} />
            </div>
          </div>

          {/* POIs visited */}
          {visitedPois.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                經過地點（{visitedPois.length}）
              </p>
              <div className="space-y-1">
                {visitedPois.map(poi => (
                  <div key={poi.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded-lg bg-muted/40">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{poi.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onCancel}>捨棄</Button>
          <Button className="flex-1 gap-2" onClick={() => onSave(name.trim() || defaultName, notes.trim())}>
            <Save className="h-4 w-4" />
            儲存到步道
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
