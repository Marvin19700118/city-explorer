'use client';

import * as React from 'react';
import { History, MapPin, Footprints, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Trip } from '@/lib/types';

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

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <History className="h-6 w-6" />
        <h2>Exploration History</h2>
      </header>

      {trips.length === 0 ? (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">No Trips Yet</h3>
          <p className="text-muted-foreground mt-2">Go to the Map tab and start exploring to record your first trip!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Trip on {new Date(trip.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(trip.date).toLocaleTimeString()}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-accent font-bold">
                  <Footprints className="h-5 w-5" />
                  <span>{trip.distance.toFixed(2)} km</span>
                </div>
                <CardDescription className="mt-2">
                  A journey of {trip.path.length} recorded points.
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
