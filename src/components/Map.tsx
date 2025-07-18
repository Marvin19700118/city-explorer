'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF } from '@react-google-maps/api';
import { cn } from '@/lib/utils';
import type { PointOfInterest, Trip } from '@/lib/types';
import { Button } from './ui/button';
import { Sparkles, MapPin, AlertTriangle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type GameMapProps = {
  apiKey: string;
  userPosition: { lat: number; lng: number } | null;
  defaultCenter: { lat: number; lng: number };
  pois: PointOfInterest[];
  path: { lat: number; lng: number }[];
  trips: Trip[];
  onStartQuiz: (poi: PointOfInterest) => void;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ],
};

const currentPathOptions = {
    strokeColor: 'hsl(var(--primary))',
    strokeOpacity: 0.9,
    strokeWeight: 5,
    zIndex: 2
};

const historicalPathOptions = {
    strokeColor: 'hsl(var(--primary))',
    strokeOpacity: 0.3,
    strokeWeight: 4,
    zIndex: 1
};

export const GameMap = ({ apiKey, userPosition, defaultCenter, pois, path, trips, onStartQuiz }: GameMapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true, 
  });
  
  if (loadError) {
    return (
       <div className="flex h-full w-full items-center justify-center p-4 absolute inset-0 bg-background z-10">
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Map Load Error</AlertTitle>
            <AlertDescription>
                Could not load the map. This is often due to an invalid or misconfigured API key. Please ensure your Google Maps API key is correct, has billing enabled, and that the &apos;Maps JavaScript API&apos; is enabled in your Google Cloud Console.
            </AlertDescription>
        </Alert>
       </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-full w-full" />;
  }
  
  const center = userPosition || defaultCenter;

  return (
    <div className="absolute inset-0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={userPosition ? 15 : 12}
        options={{...mapOptions, gestureHandling: 'greedy' }}
      >
        {userPosition && (
          <MarkerF
            position={userPosition}
            icon={{
              path: 'M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0',
              fillColor: 'hsl(var(--primary))',
              fillOpacity: 1,
              strokeColor: 'hsl(var(--primary-foreground))',
              strokeWeight: 2,
              scale: 1,
            }}
          />
        )}
        
        {/* Draw historical paths */}
        {trips.map(trip => (
            <PolylineF key={trip.id} path={trip.path} options={historicalPathOptions} />
        ))}

        {/* Draw current path */}
        {path.length > 1 && <PolylineF path={path} options={currentPathOptions} />}

        {pois.map((poi) => (
          <MarkerF
            key={poi.id}
            position={poi.position}
            onClick={() => poi.discovered && onStartQuiz(poi)}
            title={poi.name}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: poi.discovered ? 8 : 5,
              fillColor: poi.discovered ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
              fillOpacity: poi.discovered ? 1 : 0.7,
              strokeColor: 'hsl(var(--background))',
              strokeWeight: 2,
            }}
            options={{
              cursor: poi.discovered ? 'pointer' : 'default',
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};
