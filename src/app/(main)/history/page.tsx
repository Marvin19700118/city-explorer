
'use client';

import * as React from 'react';
import { History, MapPin, Footprints, Calendar, Clock, Timer, Download, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Trip } from '@/lib/types';
import { formatDistance } from 'date-fns';

export default function HistoryPage() {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const savedTrips = localStorage.getItem('trips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips).sort((a: Trip, b: Trip) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, []);
  
  const getTripDuration = (trip: Trip) => {
    if (!trip.startTime || !trip.endTime) return "N/A";
    return formatDistance(new Date(trip.endTime), new Date(trip.startTime), { includeSeconds: true });
  }

  const generateGpxContent = (trip: Trip): string => {
    const points = trip.path.map(p => 
      `<trkpt lat="${p.lat}" lon="${p.lng}"></trkpt>`
    ).join('\n    ');
  
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="城市探險家" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Trip on ${new Date(trip.date).toLocaleDateString()}</name>
    <desc>A trip recorded by 城市探險家 app.</desc>
  </metadata>
  <trk>
    <name>Trip on ${new Date(trip.date).toLocaleDateString()}</name>
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
    a.download = `trip_${new Date(trip.date).toISOString().split('T')[0]}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <History className="h-6 w-6" />
        <h2>探索紀錄</h2>
      </header>

      {trips.length === 0 ? (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">還沒有任何旅程</h3>
          <p className="text-muted-foreground mt-2">到「地圖」分頁開始探索，記錄您的第一趟旅程吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
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
              <CardFooter className="p-2 border-t bg-muted/30 grid grid-cols-2 gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownloadGpx(trip)}>
                    <Download />
                    下載 GPX
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenInGoogleMaps(trip)} disabled={trip.path.length < 2}>
                    <MapIcon />
                    在地圖上開啟
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
