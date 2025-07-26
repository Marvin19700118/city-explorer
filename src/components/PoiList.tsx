
'use client';

import * as React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { PoiCard } from './PoiCard';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Search } from 'lucide-react';

interface PoiListProps {
  position: { lat: number; lng: number };
}

export const PoiList: React.FC<PoiListProps> = ({ position }) => {
  const [places, setPlaces] = React.useState<google.maps.places.PlaceResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check if google maps is loaded (e.g. from the main Map component)
    if (window.google && window.google.maps && window.google.maps.places) {
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(position.lat, position.lng),
        radius: 2000, // Search within 2km radius
        type: 'tourist_attraction',
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Calculate distance for each place and sort
          if (google.maps.geometry && google.maps.geometry.spherical) {
            const placesWithDistance = results.map(place => {
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
            placesWithDistance.sort((a, b) => a.distance - b.distance);
            setPlaces(placesWithDistance);
          } else {
            // Fallback if geometry library not loaded, just use results as is
            setPlaces(results);
          }
        } else {
            setError(`搜尋景點失敗: ${status}`);
        }
        setLoading(false);
      });
    } else {
       // If google maps is not loaded yet, wait a bit and check again.
       // This is a fallback in case this component renders before the map has loaded the script.
       const timeout = setTimeout(() => {
           if (!window.google || !window.google.maps || !window.google.maps.places) {
               setError("無法載入 Google Maps 服務。請確保您已連線至網路。");
               setLoading(false);
           }
       }, 2000);
       return () => clearTimeout(timeout);
    }
  }, [position]);
  

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
     return (
        <Alert variant="destructive">
          <AlertTitle>發生錯誤</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
     );
  }

  if (places.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">找不到附近的景點</h3>
          <p className="text-muted-foreground mt-2">試著移動到其他地方或稍後再試。</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
      {places.map((place) => (
        <PoiCard key={place.place_id} place={place} />
      ))}
    </div>
  );
};
