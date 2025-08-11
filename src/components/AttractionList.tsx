
'use client';

import * as React from 'react';
import { AttractionCard } from './AttractionCard';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Search } from 'lucide-react';
import type { LatLng } from '@/lib/types';
import { useLocation } from '@/context/LocationTrackingContext';
import { Button } from './ui/button';

type Places = (google.maps.places.PlaceResult & { distance?: number })[];

interface AttractionListProps {
  places?: Places | null;
  onSearch?: (searchFn: () => Promise<Places>) => void;
  isSearchReady?: boolean;
}

export const AttractionList: React.FC<AttractionListProps> = ({ places, onSearch, isSearchReady }) => {
  const { position, addXp, currentArea } = useLocation();

  const search = React.useCallback(async (): Promise<Places> => {
    return new Promise((resolve, reject) => {
      if (!position || typeof window.google === 'undefined' || !window.google.maps?.places) {
        console.error("Position or Google Maps Places service not available.");
        return resolve([]);
      }
      
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

          if (google.maps.geometry?.spherical) {
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
            resolve(placesWithDistance);
          } else {
            resolve(attractions);
          }
        } else {
          console.error(`Places search failed with status: ${status}`);
          resolve([]);
        }
      });
    });
  }, [position]);

  // If onSearch is provided, it means the parent component wants to control the search.
  // We render a button that triggers the search via the onSearch callback.
  if (onSearch) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Button onClick={() => onSearch(search)} disabled={!isSearchReady}>
          <Search className="mr-2 h-4 w-4" />
          搜尋附近景點
        </Button>
      </div>
    )
  }

  // If places are provided, we render the list.
  if (!places) {
    return null; // Should be handled by parent
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
