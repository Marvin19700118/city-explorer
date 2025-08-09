
'use client';

import * as React from 'react';
import { AttractionCard } from './AttractionCard';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Search } from 'lucide-react';
import type { LatLng } from '@/lib/types';
import { useLocation } from '@/context/LocationTrackingContext';

interface AttractionListProps {
  position: LatLng;
}

export const AttractionList: React.FC<AttractionListProps> = ({ position }) => {
  const [places, setPlaces] = React.useState<(google.maps.places.PlaceResult & { distance?: number })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { addXp, currentArea } = useLocation();

  React.useEffect(() => {
    if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
        const timeout = setTimeout(() => {
            if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
                setError("無法載入 Google Maps 服務。請確保您已連線至網路。");
                setLoading(false);
            }
        }, 3000);
        return () => clearTimeout(timeout);
    }
    
    if (window.google && window.google.maps && window.google.maps.places) {
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(position.lat, position.lng),
        radius: 10000, // 10km
        type: 'tourist_attraction',
        fields: ['name', 'geometry', 'photos', 'place_id', 'rating', 'types', 'vicinity'],
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const attractions = results.filter(place => (place.rating || 0) > 4.2);

          if (google.maps.geometry && google.maps.geometry.spherical) {
            const placesWithDistance = attractions.map(place => {
              const placeLocation = place.geometry?.location;
              if (placeLocation) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(position.lat, position.lng),
                  placeLocation
                );
                return { ...place, distance };
              }
              return { ...place, distance: Infinity };
            });
            placesWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            setPlaces(placesWithDistance);
          } else {
            setPlaces(attractions);
          }
        } else {
            if (status !== 'ZERO_RESULTS') {
                setError(`搜尋景點失敗: ${status}`);
            }
        }
        setLoading(false);
      });
    }
  }, [position]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="p-4">
            <Alert variant="destructive">
            <AlertTitle>發生錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     );
  }

  if (places.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">找不到附近的熱門景點</h3>
          <p className="text-muted-foreground mt-2">試著移動到其他地方或稍後再試。</p>
        </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {places.map((place) => (
        <AttractionCard 
            key={place.place_id} 
            place={place} 
            onQuizComplete={addXp}
            county={currentArea?.county || ''}
            district={currentArea?.district || ''}
        />
      ))}
    </div>
  );
};
