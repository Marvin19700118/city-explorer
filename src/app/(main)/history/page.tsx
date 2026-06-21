'use client';

import * as React from 'react';
import { History, MapPin, Footprints, Calendar, Clock, Timer, Download, Map as MapIcon, Trash2, Pencil, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trip, ActivityType } from '@/lib/types';

const ACTIVITY_OPTIONS: ActivityType[] = ['步行', '登山', '腳踏車'];
const ACTIVITY_ICON: Record<ActivityType, string> = { '步行': '🚶', '登山': '🥾', '腳踏車': '🚴' };
import { formatDistance } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useGame } from '@/context/FirebaseGameContext';
import { useToast } from '@/hooks/use-toast';

function TripCard({ trip }: { trip: Trip }) {
  const game = useGame();
  const router = useRouter();
  const { toast } = useToast();

  const [editing, setEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [editActivity, setEditActivity] = React.useState<ActivityType>('步行');
  const [saving, setSaving] = React.useState(false);

  const displayName = trip.name ?? `${new Date(trip.date).toLocaleDateString()} 的旅程`;

  const startEdit = () => {
    setEditName(trip.name ?? displayName);
    setEditNotes(trip.notes ?? '');
    setEditActivity((trip.activityType as ActivityType) ?? '步行');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    await game.updateTrip(trip.id, editName.trim() || displayName, editNotes.trim(), editActivity);
    setSaving(false);
    setEditing(false);
    toast({ title: '已更新', description: '旅程資訊已儲存。' });
  };

  const getTripDuration = () => {
    if (!trip.startTime || !trip.endTime) return 'N/A';
    return formatDistance(new Date(trip.endTime), new Date(trip.startTime), { includeSeconds: true });
  };

  const generateGpxContent = (): string => {
    const startDt = trip.startTime ? new Date(trip.startTime) : new Date(trip.date);
    const endDt = trip.endTime ? new Date(trip.endTime) : null;
    const totalMs = endDt ? endDt.getTime() - startDt.getTime() : 0;
    const intervalMs = trip.path.length > 1 && totalMs > 0 ? totalMs / (trip.path.length - 1) : 0;
    const points = trip.path.map((p, i) => {
      const ptTime = new Date(startDt.getTime() + i * intervalMs);
      return `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${ptTime.toISOString()}</time></trkpt>`;
    }).join('\n');
    const trackName = displayName;
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AI城市導遊" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${trackName}</name><time>${startDt.toISOString()}</time></metadata>
  <trk><name>${trackName}</name><trkseg>\n${points}\n  </trkseg></trk>
</gpx>`;
  };

  const getGpxFileName = () => {
    const startDt = trip.startTime ? new Date(trip.startTime) : new Date(trip.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `walk_${startDt.getFullYear()}-${pad(startDt.getMonth()+1)}-${pad(startDt.getDate())}_${pad(startDt.getHours())}-${pad(startDt.getMinutes())}-${pad(startDt.getSeconds())}.gpx`;
  };

  const handleExportGpx = async () => {
    const content = generateGpxContent();
    const fileName = getGpxFileName();
    const file = new File([content], fileName, { type: 'application/gpx+xml' });

    // Try Web Share API (mobile: shows native share sheet with Mail, LINE, etc.)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: displayName,
          text: `GPX 軌跡：${displayName}`,
        });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return; // user cancelled — do nothing
        // Share failed, fall through to download
      }
    }

    // Fallback: direct download (desktop)
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <Card>
      <CardHeader className="pb-2">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={50}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="旅程名稱"
              autoFocus
            />
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value.slice(0, 30))}
              rows={2}
              maxLength={30}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="備註（最多 30 字）"
            />
            <select
              value={editActivity}
              onChange={e => setEditActivity(e.target.value as ActivityType)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ACTIVITY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{ACTIVITY_ICON[opt]} {opt}</option>
              ))}
            </select>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{editNotes.length}/30</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                  <X className="h-3.5 w-3.5 mr-1" />取消
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={saving}>
                  <Check className="h-3.5 w-3.5 mr-1" />{saving ? '儲存中…' : '儲存'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <CardTitle className="flex items-start justify-between gap-2 text-base leading-snug">
            <div className="flex items-start gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="truncate">{displayName}</p>
                {trip.notes && (
                  <p className="text-sm font-normal text-muted-foreground mt-0.5 line-clamp-2">{trip.notes}</p>
                )}
              </div>
            </div>
            <button onClick={startEdit} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </CardTitle>
        )}
        <CardDescription className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : 'N/A'} - {trip.endTime ? new Date(trip.endTime).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {ACTIVITY_ICON[(trip.activityType as ActivityType) ?? '步行']} {trip.activityType ?? '步行'}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2 text-accent font-bold">
            <Footprints className="h-5 w-5" />
            <span>{trip.distance.toFixed(2)} 公里</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <span>{getTripDuration()}</span>
          </div>
        </div>
        <CardDescription>一段包含 {trip.path.length} 個紀錄點的旅程。</CardDescription>
      </CardContent>

      <CardFooter className="p-2 border-t bg-muted/30 grid grid-cols-3 gap-2">
        <Button variant="ghost" size="sm" onClick={handleExportGpx}>
          <Download className="h-4 w-4 mr-1" />匯出 GPX
        </Button>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/map?trip=${trip.id}`)} disabled={trip.path.length < 2}>
          <MapIcon className="h-4 w-4 mr-1" />在地圖上開啟
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-1" />刪除紀錄
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
              <AlertDialogDescription>這個操作無法復原，將永久刪除此旅程紀錄。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => game.removeTrip(trip.id)} className="bg-destructive hover:bg-destructive/90">
                確認刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export default function HistoryPage() {
  const game = useGame();

  if (game.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <History className="h-6 w-6" />
          <h2>探索紀錄</h2>
        </header>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <History className="h-6 w-6" />
        <h2>探索紀錄</h2>
      </header>

      {game.trips.length === 0 ? (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">還沒有任何旅程</h3>
          <p className="text-muted-foreground mt-2">到「地圖」分頁開始探索，記錄您的第一趟旅程吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {game.trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}
    </div>
  );
}
