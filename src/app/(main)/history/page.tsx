'use client';

import * as React from 'react';
import { History, MapPin, Footprints, Calendar, Clock, Timer, Download, Map as MapIcon, Trash2, BookMarked } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trip, Trail } from '@/lib/types';
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

export default function HistoryPage() {
  const game = useGame();

  const getTripDuration = (trip: Trip) => {
    if (!trip.startTime || !trip.endTime) return "N/A";
    return formatDistance(new Date(trip.endTime), new Date(trip.startTime), { includeSeconds: true });
  }

  const generateGpxContent = (trip: Trip): string => {
    const startDt = trip.startTime ? new Date(trip.startTime) : new Date(trip.date);
    const endDt   = trip.endTime   ? new Date(trip.endTime)   : null;
    const totalMs = endDt ? endDt.getTime() - startDt.getTime() : 0;
    const intervalMs = trip.path.length > 1 && totalMs > 0
      ? totalMs / (trip.path.length - 1)
      : 0;

    const points = trip.path.map((p, i) => {
      const ptTime = new Date(startDt.getTime() + i * intervalMs);
      return `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${ptTime.toISOString()}</time></trkpt>`;
    }).join('\n');

    const trackName = `散步紀錄 ${startDt.toLocaleDateString('zh-TW')} ${startDt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AI城市導遊" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${trackName}</name>
    <time>${startDt.toISOString()}</time>
  </metadata>
  <trk>
    <name>${trackName}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
  };

  const handleDownloadGpx = (trip: Trip) => {
    const gpxContent = generateGpxContent(trip);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const startDt = trip.startTime ? new Date(trip.startTime) : new Date(trip.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fileName = `walk_${startDt.getFullYear()}-${pad(startDt.getMonth()+1)}-${pad(startDt.getDate())}_${pad(startDt.getHours())}-${pad(startDt.getMinutes())}-${pad(startDt.getSeconds())}.gpx`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToTrails = async (trip: Trip) => {
    const startDt = trip.startTime ? new Date(trip.startTime) : new Date(trip.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const name = `散步紀錄 ${startDt.getFullYear()}-${pad(startDt.getMonth()+1)}-${pad(startDt.getDate())} ${pad(startDt.getHours())}:${pad(startDt.getMinutes())}`;

    const trail: Trail = {
      id: `walk-${trip.id}`,
      name,
      difficulty: 'easy',
      points: trip.path.map(p => ({ lat: p.lat, lng: p.lng })),
      waypoints: [],
      totalDistanceKm: trip.distance,
      elevationGainM: trip.elevationGainM ?? 0,
      walkedPoints: [],
      walkedDistanceKm: 0,
      completionPercent: 0,
      importedAt: new Date().toISOString(),
    };

    await game.addCustomTrail(trail);
    toast({ title: '已儲存到步道', description: `「${name}」已加入步道列表。` });
  };

  const handleDownloadAndSave = async (trip: Trip) => {
    handleDownloadGpx(trip);
    await handleSaveToTrails(trip);
  };

  const handleOpenInGoogleMaps = (trip: Trip) => {
    if (trip.path.length < 2) return;
    const origin = `${trip.path[0].lat},${trip.path[0].lng}`;
    const destination = `${trip.path[trip.path.length - 1].lat},${trip.path[trip.path.length - 1].lng}`;
    const waypoints = trip.path.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');

    // Google Maps URL has a length limit, for very long trips, we might need to simplify waypoints
    // For now, let's assume it's okay.
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const handleDeleteTrip = async (tripId: string) => {
    await game.removeTrip(tripId);
  };

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
          {game.trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                   <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(trip.date).toLocaleDateString()} 的旅程</span>
                  </div>
                </CardTitle>
                 <CardDescription className="flex items-center gap-2 pt-1">
                   <Clock className="h-4 w-4" />
                   <span>
                      {trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : 'N/A'} - {trip.endTime ? new Date(trip.endTime).toLocaleTimeString() : 'N/A'}
                   </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2 text-accent font-bold">
                        <Footprints className="h-5 w-5" />
                        <span>{trip.distance.toFixed(2)} 公里</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        <span>{getTripDuration(trip)}</span>
                    </div>
                </div>
                <CardDescription>
                  一段包含 {trip.path.length} 個紀錄點的旅程。
                </CardDescription>
              </CardContent>
              <CardFooter className="p-2 border-t bg-muted/30 grid grid-cols-3 gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownloadAndSave(trip)}>
                    <BookMarked />
                    匯出到步道
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenInGoogleMaps(trip)} disabled={trip.path.length < 2}>
                    <MapIcon />
                    在地圖上開啟
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 />
                        刪除紀錄
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
                      <AlertDialogDescription>
                        這個操作無法復原。這將會永久刪除您這次的旅程紀錄。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)} className="bg-destructive hover:bg-destructive/90">
                        確認刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
