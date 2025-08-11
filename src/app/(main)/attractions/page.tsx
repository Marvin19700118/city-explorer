
'use client';

import * as React from 'react';
import { Landmark, MapPin, Search } from 'lucide-react';
import { useLocation } from '@/context/LocationTrackingContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AttractionList } from '@/components/AttractionList';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ('maps' | 'places')[] = ['maps', 'places'];

type Places = (google.maps.places.PlaceResult & { distance?: number })[];

export default function AttractionsPage() {
  const { position, loading, error } = useLocation();
  const [isClient, setIsClient] = React.useState(false);
  const [places, setPlaces] = React.useState<Places | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const { isLoaded: isMapApiLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    preventGoogleFontsLoading: true, 
    libraries,
  });

  const incrementPlacesApiCount = () => {
    if (typeof window === 'undefined') return;
    let count = parseInt(localStorage.getItem('placesApiCallCount') || '0', 10);
    count++;
    localStorage.setItem('placesApiCallCount', count.toString());
  };


  const searchNearbyAttractions = React.useCallback(async (): Promise<Places> => {
    return new Promise((resolve) => {
      if (!position || !isMapApiLoaded) {
        console.error("Position or Google Maps Places service not available.");
        return resolve([]);
      }
      
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(position.lat, position.lng),
        radius: 10000, // 10km
        type: 'tourist_attraction',
        fields: ['name', 'geometry', 'photos', 'place_id', 'rating', 'types', 'vicinity', 'business_status'],
      };

      incrementPlacesApiCount();

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const attractions = results.filter(place => 
            place.business_status === 'OPERATIONAL' && (place.rating || 0) > 4.2
          );

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
  }, [position, isMapApiLoaded]);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // Automatically search when position and API are ready, but only once.
    if (position && isMapApiLoaded && !isSearching && !hasSearched) {
      setIsSearching(true);
      setHasSearched(true); // Prevent re-searching
      searchNearbyAttractions().then(results => {
        setPlaces(results);
        setIsSearching(false);
      });
    }
  }, [position, isMapApiLoaded, isSearching, hasSearched, searchNearbyAttractions]);


  if (!isClient) {
    return (
      <div className="p-4 space-y-4">
        <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <Landmark className="h-6 w-6" />
          <h2>熱門景點</h2>
        </header>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const renderContent = () => {
    if (loading || isSearching) {
      return (
         <div className="space-y-3 p-4">
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
            <Terminal className="h-4 w-4" />
            <AlertTitle>定位錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (typeof window !== 'undefined' && !navigator.onLine) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/50 rounded-lg">
          <WifiOff className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">網路未連線</h3>
          <p className="text-muted-foreground mt-2">請檢查您的網路連線以搜尋附近的熱門景點。</p>
        </div>
      );
    }

    if (places && places.length === 0 && hasSearched) {
       return (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">找不到附近的熱門景點</h3>
          <p className="text-muted-foreground mt-2">試著移動到其他地方或稍後再試。</p>
        </div>
      );
    }

    if (places && places.length > 0) {
        return <AttractionList places={places} />;
    }

    // Default state before search is triggered
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/50 rounded-lg">
        <MapPin className="w-16 h-16 mx-auto text-accent animate-pulse" />
        <h3 className="text-2xl font-bold mt-4">正在尋找附近景點...</h3>
        <p className="text-muted-foreground mt-2">請允許位置存取權限並稍待片刻。</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b">
        <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <Landmark className="h-6 w-6" />
          <h2>熱門景點</h2>
        </div>
        <p className="text-muted-foreground text-sm">探索您附近（10公里內）評價最高的旅遊景點。</p>
      </header>
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}
