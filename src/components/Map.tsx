
'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, PolygonF } from '@react-google-maps/api';
import { cn } from '@/lib/utils';
import type { PointOfInterest, Trip } from '@/lib/types';
import { Button } from './ui/button';
import { Sparkles, MapPin, AlertTriangle, LocateFixed } from 'lucide-react';
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
  fogOpacity: number;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#7c93a3"
        },
        {
          "lightness": "-10"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#a0a4a5"
        }
      ]
    },
    {
      "featureType": "administrative.province",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#62838e"
        }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#f2f2f2"
        }
      ]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#bae5a6"
        },
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "all",
      "stylers": [
        {
          "saturation": -100
        },
        {
          "lightness": 45
        },
        {
          "visibility": "simplified"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "all",
      "stylers": [
        {
          "visibility": "simplified"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#fac9a9"
        },
        {
          "visibility": "simplified"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text",
      "stylers": [
        {
          "color": "#4e4e4e"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#787878"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [
        {
          "visibility": "simplified"
        }
      ]
    },
    {
      "featureType": "transit.station.airport",
      "elementType": "labels.icon",
      "stylers": [
        {
          "hue": "#0a00ff"
        },
        {
          "saturation": "-77"
        },
        {
          "gamma": "2.15"
        },
        {
          "lightness": "12"
        }
      ]
    },
    {
      "featureType": "transit.station.rail",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#43321e"
        }
      ]
    },
    {
      "featureType": "transit.station.rail",
      "elementType": "labels.icon",
      "stylers": [
        {
          "hue": "#ff6c00"
        },
        {
          "lightness": "4"
        },
        {
          "gamma": "0.75"
        },
        {
          "saturation": "-68"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "all",
      "stylers": [
        {
          "color": "#eaf6f8"
        },
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#c7eced"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "lightness": "-49"
        },
        {
          "saturation": "-53"
        },
        {
          "gamma": "0.79"
        }
      ]
    }
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

// A huge polygon to cover the whole world, with holes for discovered areas
const createFogPaths = (pois: PointOfInterest[]) => {
    const WORLD_CORNERS = [
        { lat: 90, lng: -180 },
        { lat: 90, lng: 180 },
        { lat: -90, lng: 180 },
        { lat: -90, lng: -180 },
    ];

    const discoveredPoiHoles = pois.filter(p => p.discovered).map(poi => {
        // Create a small square hole around the discovered POI
        const radius = 0.01; // Approx 1.1km
        return [
            { lat: poi.position.lat - radius, lng: poi.position.lng - radius },
            { lat: poi.position.lat + radius, lng: poi.position.lng - radius },
            { lat: poi.position.lat + radius, lng: poi.position.lng + radius },
            { lat: poi.position.lat - radius, lng: poi.position.lng + radius },
        ];
    });

    return [WORLD_CORNERS, ...discoveredPoiHoles];
}

const libraries: ('maps' | 'places')[] = ['maps', 'places'];

export const GameMap = ({ apiKey, userPosition, defaultCenter, pois, path, trips, onStartQuiz, fogOpacity }: GameMapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true, 
    libraries,
  });
  
  const mapRef = React.useRef<google.maps.Map | null>(null);

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
    mapRef.current = null;
  }, []);

  const handleRecenter = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.panTo(userPosition);
    }
  };

  const fogPaths = React.useMemo(() => createFogPaths(pois), [pois]);
  const fogOptions = React.useMemo(() => ({
    fillColor: '#000000',
    fillOpacity: fogOpacity / 100,
    strokeWeight: 0,
    clickable: false,
    zIndex: 1,
  }), [fogOpacity]);


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
    return <Skeleton className="absolute inset-0" />;
  }
  
  const center = userPosition || defaultCenter;

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={userPosition ? 14 : 12}
        options={{...mapOptions, gestureHandling: 'greedy' }}
        onLoad={onLoad}
        onUnmount={onUnmount}
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
        
        <PolygonF paths={fogPaths} options={fogOptions} />
        
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
              zIndex: 2, // Ensure POIs are above the fog
            }}
          />
        ))}
      </GoogleMap>
       <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 z-10 shadow-lg"
        onClick={handleRecenter}
        disabled={!userPosition}
        aria-label="Recenter map"
      >
        <LocateFixed className="h-5 w-5" />
      </Button>
    </>
  );
};
