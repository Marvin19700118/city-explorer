import type { Trail, TrailDifficulty, TrailPoint, TrailWaypoint, PoiType } from './types';

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

function detectPoiType(name: string): PoiType {
  const n = name;
  if (/登山口|入口|trailhead/i.test(n)) return 'trailhead';
  if (/山頂|三角點|峰頂|summit/i.test(n)) return 'summit';
  if (/瀑布|waterfall/i.test(n)) return 'waterfall';
  if (/觀景台|展望|景觀|viewpoint/i.test(n)) return 'viewpoint';
  if (/廟|宮|寺|temple/i.test(n)) return 'temple';
  return 'general';
}

function inferDifficulty(distKm: number, elevGainM: number): TrailDifficulty {
  const score = distKm + elevGainM / 300;
  if (score < 5) return 'easy';
  if (score < 12) return 'moderate';
  if (score < 20) return 'hard';
  return 'expert';
}

export function parseGpx(xmlString: string, fileName: string): Trail {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const nameEl = doc.querySelector('trk > name');
  const name = nameEl?.textContent?.trim() || fileName.replace(/\.gpx$/i, '');

  // Parse track points
  const trkpts = Array.from(doc.querySelectorAll('trkpt'));
  const points: TrailPoint[] = [];
  let elevationGainM = 0;
  let prevEle: number | null = null;

  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute('lat') || '');
    const lng = parseFloat(pt.getAttribute('lon') || '');
    if (isNaN(lat) || isNaN(lng)) continue;

    const eleText = pt.querySelector('ele')?.textContent;
    const elevation = eleText ? parseFloat(eleText) : undefined;
    points.push({ lat, lng, elevation });

    if (elevation !== undefined && prevEle !== null) {
      const gain = elevation - prevEle;
      if (gain > 2) elevationGainM += gain; // filter GPS noise
    }
    if (elevation !== undefined) prevEle = elevation;
  }

  // Parse waypoints
  const wpts = Array.from(doc.querySelectorAll('wpt'));
  const waypoints: TrailWaypoint[] = wpts.map((wpt, i) => {
    const lat = parseFloat(wpt.getAttribute('lat') || '');
    const lng = parseFloat(wpt.getAttribute('lon') || '');
    const wname = wpt.querySelector('name')?.textContent?.trim() || `地標 ${i + 1}`;
    const eleText = wpt.querySelector('ele')?.textContent;
    return {
      id: `wpt-${Date.now()}-${i}`,
      name: wname,
      position: { lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng },
      poiType: detectPoiType(wname),
      elevation: eleText ? parseFloat(eleText) : undefined,
    };
  });

  // Calculate total distance
  let totalDistanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistanceKm += haversineKm(points[i - 1], points[i]);
  }

  return {
    id: `trail-${Date.now()}`,
    name,
    difficulty: inferDifficulty(totalDistanceKm, elevationGainM),
    points,
    waypoints,
    totalDistanceKm,
    elevationGainM: Math.round(elevationGainM),
    walkedPoints: [],
    walkedDistanceKm: 0,
    completionPercent: 0,
    importedAt: new Date().toISOString(),
  };
}
