
'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, PolylineF, OverlayViewF } from '@react-google-maps/api';
import { cn } from '@/lib/utils';
import type { PointOfInterest, Trip, Trail, PoiType } from '@/lib/types';
import { getWalkedSegments } from '@/lib/trailCompletion';
import { Button } from './ui/button';
import { AlertTriangle, LocateFixed } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const POI_TYPE_EMOJI: Record<PoiType, string> = {
  trailhead: '⛺', summit: '🏔️', waterfall: '💧',
  viewpoint: '👁️', temple: '🏛️', general: '🏛',
};

// Bubble background colour per type
const POI_TYPE_COLOR: Record<PoiType, string> = {
  trailhead: '#16a34a',
  summit:    '#ea580c',
  waterfall: '#2563eb',
  viewpoint: '#9333ea',
  temple:    '#dc2626',
  general:   '#0d9488',
};

// --- Pikmin-style bubble marker ---
function PikminMarker({
  poi, onClick,
}: { poi: PointOfInterest; onClick: () => void }) {
  const type = poi.poiType ?? 'general';
  const emoji = POI_TYPE_EMOJI[type];
  const color = POI_TYPE_COLOR[type];
  const visits = poi.visitCount ?? 0;

  return (
    <div
      onClick={onClick}
      style={{
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
      }}
    >
      {/* Bubble */}
      <div style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        background: `radial-gradient(circle at 38% 32%, ${color}ee, ${color})`,
        border: '3px solid #ffffffcc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        position: 'relative',
        boxShadow: `0 0 0 2px ${color}66`,
      }}>
        <span style={{ lineHeight: 1 }}>{emoji}</span>

        {/* Visit count badge */}
        {visits > 0 && (
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: '#f59e0b',
            border: '2px solid white',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
          }}>
            {visits > 9 ? '9+' : visits}
          </div>
        )}
      </div>

      {/* Tail */}
      <div style={{
        width: 0,
        height: 0,
        marginTop: -1,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: `11px solid ${color}`,
      }} />
    </div>
  );
}

// --- Player marker (Pikmin Bloom style) ---
function PlayerMarker() {
  return (
    <div style={{
      transform: 'translate(-50%, -50%)',
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 40% 35%, #60a5fa, #1d4ed8)',
      border: '3px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      boxShadow: '0 0 0 4px rgba(59,130,246,0.35), 0 3px 8px rgba(0,0,0,0.5)',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
    }}>
      🧍
    </div>
  );
}

// --- Waypoint marker (trail) ---
function WaypointMarker({ poiType, name }: { poiType: PoiType; name: string }) {
  const emoji = POI_TYPE_EMOJI[poiType];
  const color = POI_TYPE_COLOR[poiType];
  return (
    <div
      title={name}
      style={{
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
      }}
    >
      <div style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: `radial-gradient(circle at 38% 32%, ${color}cc, ${color}99)`,
        border: '2px solid #ffffffaa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 17,
      }}>
        {emoji}
      </div>
      <div style={{
        width: 0, height: 0,
        marginTop: -1,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: `8px solid ${color}99`,
      }} />
    </div>
  );
}

type GameMapProps = {
  apiKey: string;
  userPosition: { lat: number; lng: number } | null;
  defaultCenter: { lat: number; lng: number };
  pois: PointOfInterest[];
  path: { lat: number; lng: number }[];
  trips: Trip[];
  trails: Trail[];
  onStartQuiz: (poi: PointOfInterest) => void;
  fogOpacity: number;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    // Hide default POI icons (we use our own)
    { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
    // Parks: soft green
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d1fae5' }] },
    // Natural: light green
    { featureType: 'landscape.natural', elementType: 'geometry.fill', stylers: [{ color: '#ecfdf5' }] },
    // Built areas: very light grey
    { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#f8fafc' }] },
    // Roads: white/cream
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e8f0' }] },
    { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#fef9c3' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#fde68a' }] },
    // Water: light blue
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#bfdbfe' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3b82f6' }] },
    // Transit: keep simplified
    { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'simplified' }] },
    // Text: keep readable
    { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
    { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
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

const MIN_POINT_SPACING = 0.0005; // ~55m

// Each explore point carries an intensity (1 = walked once, higher = visited more)
type ExplorePoint = { lat: number; lng: number; radiusDeg: number; intensity: number };

function getPathRadiusDeg(): number {
  if (typeof window === 'undefined') return 0.003;
  try {
    const cityPoints = JSON.parse(localStorage.getItem('cityPoints') || '{}');
    const totalXp = Object.values(cityPoints as Record<string, number>).reduce((s, v) => s + v, 0);
    if (totalXp >= 2500) return 0.006;
    if (totalXp >= 500)  return 0.004;
    return 0.003;
  } catch { return 0.003; }
}

function samplePath(path: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  if (path.length === 0) return [];
  const result = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const prev = result[result.length - 1];
    const curr = path[i];
    const dlat = curr.lat - prev.lat;
    const dlng = curr.lng - prev.lng;
    if (Math.sqrt(dlat * dlat + dlng * dlng) > MIN_POINT_SPACING) result.push(curr);
  }
  return result;
}

function buildExplorePoints(
  pois: PointOfInterest[],
  currentPath: { lat: number; lng: number }[],
  trips: Trip[]
): ExplorePoint[] {
  const pathRadius = getPathRadiusDeg();
  const pts: ExplorePoint[] = [];

  // Visited POIs: larger radius, intensity = visitCount (max 8)
  for (const poi of pois.filter(p => (p.visitCount ?? 0) > 0))
    pts.push({ lat: poi.position.lat, lng: poi.position.lng, radiusDeg: 0.008, intensity: Math.min(poi.visitCount ?? 1, 8) });

  // Walked path points: smaller radius, intensity 1
  for (const pt of [...samplePath(currentPath), ...trips.flatMap(t => samplePath(t.path))])
    pts.push({ lat: pt.lat, lng: pt.lng, radiusDeg: pathRadius, intensity: 1 });

  return pts;
}

function drawExploreCanvas(
  canvas: HTMLCanvasElement,
  map: google.maps.Map,
  explorePoints: ExplorePoint[]
) {
  const proj = map.getProjection();
  const bounds = map.getBounds();
  if (!proj || !bounds) return;

  const mapDiv = map.getDiv();
  const w = mapDiv.offsetWidth;
  const h = mapDiv.offsetHeight;
  if (w === 0 || h === 0) return;
  canvas.width = w;
  canvas.height = h;

  const zoom = map.getZoom() ?? 14;
  const scale = Math.pow(2, zoom);
  const nwWorld = proj.fromLatLngToPoint(
    new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng())
  )!;

  const toPixel = (lat: number, lng: number) => {
    const p = proj.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
    if (!p) return null;
    return { x: (p.x - nwWorld.x) * scale, y: (p.y - nwWorld.y) * scale };
  };

  const centerLat = map.getCenter()?.lat() ?? 25;
  const metersPerPx = (156543.03392 * Math.cos(centerLat * Math.PI / 180)) / scale;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  // Draw green tint on explored areas — soft radial gradient per point
  // intensity 1 = alpha ~0.12 (light), intensity 8 = alpha ~0.38 (deep but map still visible)
  ctx.globalCompositeOperation = 'source-over';
  for (const pt of explorePoints) {
    const px = toPixel(pt.lat, pt.lng);
    if (!px) continue;
    const r = (pt.radiusDeg * 111000) / metersPerPx;
    const alpha = Math.min(0.38, 0.08 + pt.intensity * 0.038);

    const g = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, r);
    g.addColorStop(0,    `rgba(34, 197, 94, ${alpha})`);     // green-500 core
    g.addColorStop(0.55, `rgba(74, 222, 128, ${alpha * 0.7})`); // green-400 mid
    g.addColorStop(0.85, `rgba(134, 239, 172, ${alpha * 0.3})`); // green-300 fade
    g.addColorStop(1,    'rgba(134, 239, 172, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px.x, px.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const libraries: ('maps' | 'places')[] = ['maps', 'places'];

export const GameMap = ({ apiKey, userPosition, defaultCenter, pois, path, trips, trails, onStartQuiz, fogOpacity }: GameMapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true, 
    libraries,
  });
  
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

  // Debounce path updates — fog recomputes after GPS settles for 800ms
  const [debouncedPath, setDebouncedPath] = React.useState(path);
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedPath(path), 800);
    return () => clearTimeout(id);
  }, [path]);

  const explorePoints = React.useMemo(
    () => buildExplorePoints(pois, debouncedPath, trips),
    [pois, debouncedPath, trips]
  );

  const redrawFog = React.useCallback(() => {
    if (canvasRef.current && mapRef.current)
      drawExploreCanvas(canvasRef.current, mapRef.current, explorePoints);
  }, [explorePoints]);

  // Redraw on map pan/zoom
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const listeners = [
      map.addListener('bounds_changed', redrawFog),
      map.addListener('zoom_changed', redrawFog),
    ];
    redrawFog();
    return () => listeners.forEach(l => google.maps.event.removeListener(l));
  }, [redrawFog]);

  // Redraw when fog data changes
  React.useEffect(() => { redrawFog(); }, [redrawFog]);


  if (loadError) {
    return (
       <div className="flex h-full w-full items-center justify-center p-4 bg-background z-10">
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
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={userPosition ? 14 : 12}
        options={{...mapOptions, gestureHandling: 'greedy' }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {userPosition && (
          <OverlayViewF
            position={userPosition}
            mapPaneName="overlayMouseTarget"
          >
            <PlayerMarker />
          </OverlayViewF>
        )}
        
        {/* Draw trail overlays */}
        {trails.map(trail => {
          const trailPath = trail.points.map(p => ({ lat: p.lat, lng: p.lng }));
          const walkedSegs = getWalkedSegments(trail);
          return (
            <React.Fragment key={trail.id}>
              {/* Full trail: dashed grey */}
              <PolylineF
                path={trailPath}
                options={{ strokeColor: '#888888', strokeOpacity: 0.5, strokeWeight: 3, zIndex: 0,
                  icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '12px' }] }}
              />
              {/* Walked segments: solid green */}
              {walkedSegs.map((seg, i) => (
                <PolylineF
                  key={i}
                  path={seg}
                  options={{ strokeColor: '#22c55e', strokeOpacity: 0.9, strokeWeight: 4, zIndex: 1 }}
                />
              ))}
              {/* Waypoint markers hidden — map stays clean */}
            </React.Fragment>
          );
        })}

        {/* Draw historical paths */}
        {trips.map(trip => (
            <PolylineF key={trip.id} path={trip.path} options={historicalPathOptions} />
        ))}

        {/* Draw current path */}
        {path.length > 1 && <PolylineF path={path} options={currentPathOptions} />}

        {/* POI markers hidden — map stays clean */}
      </GoogleMap>

      {/* Canvas fog overlay — pointer-events:none passes clicks through to map */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      />

       <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 z-10 shadow-lg"
        style={{ zIndex: 10 }}
        onClick={handleRecenter}
        disabled={!userPosition}
        aria-label="Recenter map"
      >
        <LocateFixed className="h-5 w-5" />
      </Button>
    </div>
  );
};
