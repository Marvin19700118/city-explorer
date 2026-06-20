import type { PointOfInterest, PoiType } from './types';

const SEARCH_RADIUS_ATTRACTION = 5000;  // 5km for tourist spots
const SEARCH_RADIUS_TRAIL = 10000;       // 10km for hiking

function detectPoiType(place: google.maps.places.PlaceResult): PoiType {
  const types = place.types || [];
  const name = (place.name || '').toLowerCase();
  const isHike = /步道|登山|trail|hiking|trailhead|mountain|山/i.test(name);

  if (types.includes('natural_feature')) return isHike ? 'summit' : 'viewpoint';
  if (types.includes('park') && isHike) return 'trailhead';
  if (types.includes('place_of_worship')) return 'temple';
  if (types.includes('natural_feature')) return 'viewpoint';
  return 'general';
}

function placeToPoI(place: google.maps.places.PlaceResult): PointOfInterest | null {
  const loc = place.geometry?.location;
  if (!loc || !place.place_id || !place.name) return null;
  return {
    id: place.place_id,
    name: place.name,
    position: { lat: loc.lat(), lng: loc.lng() },
    areaDescription: place.vicinity || place.name,
    discovered: false,
    county: '',
    district: '',
    poiType: detectPoiType(place),
    quizzable: true,
  };
}

function nearbySearch(
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise(resolve => {
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
}

export async function fetchNearbyPOIs(
  position: { lat: number; lng: number }
): Promise<PointOfInterest[]> {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  const center = new google.maps.LatLng(position.lat, position.lng);

  const [attractions, parks, trails] = await Promise.all([
    nearbySearch(service, {
      location: center,
      radius: SEARCH_RADIUS_ATTRACTION,
      type: 'tourist_attraction',
      language: 'zh-TW',
    } as google.maps.places.PlaceSearchRequest),
    nearbySearch(service, {
      location: center,
      radius: SEARCH_RADIUS_TRAIL,
      type: 'park',
      language: 'zh-TW',
    } as google.maps.places.PlaceSearchRequest),
    nearbySearch(service, {
      location: center,
      radius: SEARCH_RADIUS_TRAIL,
      keyword: '步道 OR 登山口 OR trail',
      type: 'natural_feature',
      language: 'zh-TW',
    } as google.maps.places.PlaceSearchRequest),
  ]);

  // Merge and deduplicate by place_id
  const seen = new Set<string>();
  const pois: PointOfInterest[] = [];

  for (const place of [...attractions, ...parks, ...trails]) {
    if (!place.place_id || seen.has(place.place_id)) continue;
    seen.add(place.place_id);

    // Only include reasonably rated or unrated places
    if (place.rating !== undefined && place.rating < 3.8) continue;

    const poi = placeToPoI(place);
    if (poi) pois.push(poi);
  }

  // Sort by distance
  if (window.google.maps.geometry?.spherical) {
    pois.sort((a, b) => {
      const da = google.maps.geometry.spherical.computeDistanceBetween(
        center, new google.maps.LatLng(a.position.lat, a.position.lng)
      );
      const db = google.maps.geometry.spherical.computeDistanceBetween(
        center, new google.maps.LatLng(b.position.lat, b.position.lng)
      );
      return da - db;
    });
  }

  return pois.slice(0, 40); // cap at 40 POIs
}

/** Returns true if position has moved >3km from last search center */
export function shouldRefreshPOIs(position: { lat: number; lng: number }): boolean {
  try {
    const meta = JSON.parse(localStorage.getItem('nearbyPoisMeta') || 'null');
    if (!meta) return true;
    const sixHours = 6 * 60 * 60 * 1000;
    if (Date.now() - meta.timestamp > sixHours) return true;
    const dlat = position.lat - meta.center.lat;
    const dlng = position.lng - meta.center.lng;
    const distDeg = Math.sqrt(dlat * dlat + dlng * dlng);
    return distDeg > 0.027; // ~3km
  } catch { return true; }
}

export function saveNearbyPOIsMeta(center: { lat: number; lng: number }) {
  localStorage.setItem('nearbyPoisMeta', JSON.stringify({ center, timestamp: Date.now() }));
}
