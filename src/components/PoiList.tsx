
'use client';

import * as React from 'react';
import { PoiCard } from './PoiCard';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Search } from 'lucide-react';
import type { LatLng } from '@/lib/types';
import { useLocation } from '@/context/LocationTrackingContext';
import { Button } from './ui/button';

type Places = (google.maps.places.PlaceResult & { distance?: number })[];

interface PoiListProps {
  places?: Places | null;
  onSearch?: (searchFn: () => Promise<Places>) => void;
}

export const PoiList: React.FC<PoiListProps> = ({ places, onSearch }) => {
  const { position } = useLocation();

  const search = React.useCallback((): Promise<Places> => {
    return new Promise((resolve) => {
      if (!position || !window.google?.maps?.places) {
        console.error("Position or Google Maps Places service not available.");
        return resolve([]);
      }

      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(position.lat, position.lng),
        radius: 2000,
        type: 'restaurant',
        fields: ['name', 'geometry', 'photos', 'place_id', 'rating', 'types', 'business_status', 'vicinity'],
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const openPlaces = results.filter(place =>
            place.business_status === 'OPERATIONAL' && (place.rating || 0) > 4
          );

          if (google.maps.geometry?.spherical) {
            const placesWithDistance = openPlaces.map(place => {
              const placeLocation = place.geometry?.location;
              if (placeLocation) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(position.lat, position.lng),
                  placeLocation
                ) / 1000; // convert to km
                return { ...place, distance };
              }
              return { ...place, distance: Infinity };
            });
            placesWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            resolve(placesWithDistance);
          } else {
            resolve(openPlaces);
          }
        } else {
          console.error(`POI search failed with status: ${status}`);
          resolve([]);
        }
      });
    });
  }, [position]);

  if (onSearch) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Button onClick={() => onSearch(search)}>
          <Search className="mr-2 h-4 w-4" />
          搜尋附近美食
        </Button>
      </div>
    );
  }

  if (!places) {
     return (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">找不到附近的餐廳</h3>
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
