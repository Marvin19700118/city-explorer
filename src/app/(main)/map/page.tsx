
'use client';

import * as React from 'react';
import { MapPin, Play, Square, Trophy, Mic, Sparkles } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { GameMap } from '@/components/Map';
import { QuizModal } from '@/components/QuizModal';
import { GuideModal } from '@/components/GuideModal';
import { useLocation } from '@/context/LocationTrackingContext';
import { useGame } from '@/context/FirebaseGameContext';
import type { PointOfInterest, Trip, Settings, GenerateLocationIntroOutput, CityPoints, CurrentArea, AskedQuestionHistory } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Chatbot } from '@/components/Chatbot';
import { createQuiz } from '@/app/actions';
import { generateLocationIntro as generateLocationIntroAction } from '@/app/actions';
import Link from 'next/link';
import { DailyGoalCard } from '@/components/DailyGoalCard';
import { checkTrailCompletion, getTrailXpBonus } from '@/lib/trailCompletion';
import { fetchNearbyPOIs } from '@/lib/nearbyPlaces';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Trail } from '@/lib/types';

const TAIPEI_CENTER = { lat: 25.0330, lng: 121.5654 };
const MAP_LIBRARIES: ('maps' | 'places')[] = ['maps', 'places'];

const mockTrip: Trip = {
  id: 'mock-trip-1',
  date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  distance: 1.05,
  path: [
    { lat: 25.0330, lng: 121.5220 },
    { lat: 25.0335, lng: 121.5225 },
    { lat: 25.0340, lng: 121.5230 },
    { lat: 25.0345, lng: 121.5235 },
    { lat: 25.0350, lng: 121.5230 },
    { lat: 25.0355, lng: 121.5225 },
    { lat: 25.0360, lng: 121.5220 },
    { lat: 25.0365, lng: 121.5225 },
    { lat: 25.0370, lng: 121.5230 },
    { lat: 25.0375, lng: 121.5235 },
    { lat: 25.0380, lng: 121.5240 },
  ],
  startTime: new Date(Date.now() - 86400000 - 900000).toISOString(), // Yesterday, 15 minutes duration
  endTime: new Date(Date.now() - 86400000).toISOString(),
};

export default function MapPage() {
  const {
    position,
    distance,
    path,
    error,
    loading,
    isTracking,
    startTracking,
    stopTracking,
    elevationGain,
    getAreaNameFromPosition,
    currentArea,
    setCurrentArea,
  } = useLocation();
  const game = useGame();
  const { toast } = useToast();

  const tripStartTimeRef = React.useRef<string | null>(null);

  // poiId -> timestamp when user entered 200m radius
  const poiDwellEntryRef = React.useRef<Map<string, number>>(new Map());
  // poiId currently mid-visit (don't double-count until user leaves & re-enters)
  const poiVisitingRef = React.useRef<Set<string>>(new Set());

  const [activeQuizPoi, setActiveQuizPoi] = React.useState<PointOfInterest | null>(null);

  const [isChatbotOpen, setIsChatbotOpen] = React.useState(false);
  const [chatbotLocationName, setChatbotLocationName] = React.useState<string | null>(null);
  const [isChatbotLoading, setIsChatbotLoading] = React.useState(false);

  const [goalRefresh, setGoalRefresh] = React.useState(0);
  const [isGuideModalOpen, setIsGuideModalOpen] = React.useState(false);
  const [guideData, setGuideData] = React.useState<GenerateLocationIntroOutput | null>(null);
  const [isGuideLoading, setIsGuideLoading] = React.useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey,
    preventGoogleFontsLoading: true,
    libraries: MAP_LIBRARIES,
  });

  const handleStartTracking = () => {
    tripStartTimeRef.current = new Date().toISOString();
    startTracking();
  }

  const handleStopTracking = () => {
    if (path.length > 1 && distance > 0.01) {
      const newTrip: Trip = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        distance: distance,
        path: path,
        startTime: tripStartTimeRef.current,
        endTime: new Date().toISOString(),
        elevationGainM: Math.round(elevationGain),
      };
      game.addTrip(newTrip);
      game.addDistanceToday(distance);
      game.recordWalkToday();
      setGoalRefresh(n => n + 1);

      // Update trail completion in background to avoid UI jank
      setTimeout(() => {
        if (game.trails.length === 0) return;
        const updatedTrails = game.trails.map(trail => {
          const prevWalkedKm = trail.walkedDistanceKm;
          const updated = checkTrailCompletion(trail, [path]);
          const bonus = getTrailXpBonus(updated, prevWalkedKm);
          if (bonus > 0 && position) {
            getAreaNameFromPosition(position).then(area => {
              if (area) game.addXp(bonus, area.county, area.district);
            });
          }
          return updated;
        });
        // Save progress for changed trails
        updatedTrails.forEach(t => {
          game.updateTrailProgress(t.id, { walkedPoints: t.walkedPoints, walkedDistanceKm: t.walkedDistanceKm, completionPercent: t.completionPercent });
        });
      }, 0);

      toast({
        title: "旅程已儲存!",
        description: `您 ${distance.toFixed(2)} km，爬升 ${Math.round(elevationGain)} m 的旅程已儲存。`,
      });
    }
    stopTracking();
    tripStartTimeRef.current = null;
  };

  // Once game context finishes loading, sync trail waypoints into POIs
  React.useEffect(() => {
    if (game.isLoading) return;

    const existingPoiIds = new Set(game.pois.map(p => p.id));
    const waypointPois: PointOfInterest[] = [];
    for (const trail of game.trails) {
      for (const wpt of trail.waypoints) {
        if (!existingPoiIds.has(wpt.id)) {
          waypointPois.push({
            id: wpt.id,
            name: wpt.name,
            position: wpt.position,
            areaDescription: `${trail.name} 的${wpt.poiType === 'trailhead' ? '登山口' : wpt.poiType === 'summit' ? '山頂' : '地標'}`,
            discovered: true,
            county: '',
            district: '',
            poiType: wpt.poiType,
            quizzable: false,
          });
        }
      }
    }
    if (waypointPois.length > 0) {
      game.updatePois([...game.pois, ...waypointPois]);
    }
  }, [game.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps


  // Fetch nearby POIs from Google Maps when position + API ready
  React.useEffect(() => {
    if (!position || !isMapsLoaded) return;

    const shouldRefresh = !game.nearbyPoisMeta ||
      Date.now() - game.nearbyPoisMeta.fetchedAt > 60 * 60 * 1000 ||
      Math.abs(game.nearbyPoisMeta.center.lat - position.lat) > 0.01 ||
      Math.abs(game.nearbyPoisMeta.center.lng - position.lng) > 0.01;

    if (!shouldRefresh) return;

    fetchNearbyPOIs(position).then(freshPois => {
      if (freshPois.length === 0) return;

      // Preserve discovered status and county/district from existing POIs
      const existingMap = new Map(game.pois.map(p => [p.id, p]));
      const merged = freshPois.map(fp => {
        const existing = existingMap.get(fp.id);
        return existing ? { ...fp, discovered: existing.discovered, county: existing.county, district: existing.district } : fp;
      });

      // Keep any discovered POIs not in fresh results
      for (const existing of game.pois) {
        if (existing.discovered && !merged.find(p => p.id === existing.id)) {
          merged.push(existing);
        }
      }

      game.updatePois(merged);
      game.updateNearbyPoisMeta({ center: position, fetchedAt: Date.now() });
    });
  }, [position, isMapsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!position || !isTracking || game.pois.length === 0) return;

    const getDistanceInKm = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
      const dLon = (pos2.lng - pos1.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pos1.lat * (Math.PI / 180)) *
        Math.cos(pos2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const DISCOVERY_RADIUS_KM = (game.settings?.areaNotifications ?? true) ? 3 : 0.5; // 3km or 500m
    let updatedPois = game.pois;
    let didDiscover = false;

    const undiscoveredPois = updatedPois.filter(p => !p.discovered);

    for (const poi of undiscoveredPois) {
      const dist = getDistanceInKm(poi.position, position);

      if (dist < DISCOVERY_RADIUS_KM) {
        // Geocode the POI to get county/district for XP tracking
        getAreaNameFromPosition(poi.position).then(area => {
          if (!area) return;
          const updated = game.pois.map(p =>
            p.id === poi.id ? { ...p, county: area.county, district: area.district } : p
          );
          game.updatePois(updated);
        });

        updatedPois = updatedPois.map(p => p.id === poi.id ? { ...p, discovered: true } : p);
        didDiscover = true;
        toast({
            title: `發現：${poi.name}！`,
            description: poi.poiType === 'trailhead' || poi.poiType === 'summit'
              ? '⛰️ 登山地點解鎖，快去探索！'
              : '🏛️ 旅遊景點解鎖，點擊挑戰問答！',
            variant: "default",
        });
      }
    }

    if (didDiscover) {
        game.updatePois(updatedPois);
    }
  }, [position, game.pois, toast, isTracking, game.settings?.areaNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dwell-time visit tracking — 200m radius, 1 hour threshold
  React.useEffect(() => {
    if (!position || game.pois.length === 0) return;

    const VISIT_RADIUS_KM = 0.2;
    const VISIT_DURATION_MS = 60 * 60 * 1000;
    const now = Date.now();

    const getDistKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const s = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    };

    const toRecord: string[] = [];

    for (const poi of game.pois) {
      const dist = getDistKm(poi.position, position);

      if (dist < VISIT_RADIUS_KM) {
        if (!poiDwellEntryRef.current.has(poi.id)) {
          poiDwellEntryRef.current.set(poi.id, now);
        } else if (!poiVisitingRef.current.has(poi.id)) {
          const elapsed = now - poiDwellEntryRef.current.get(poi.id)!;
          if (elapsed >= VISIT_DURATION_MS) {
            poiVisitingRef.current.add(poi.id);
            toRecord.push(poi.id);
          }
        }
      } else {
        // Left the area — reset so next visit counts fresh
        poiDwellEntryRef.current.delete(poi.id);
        poiVisitingRef.current.delete(poi.id);
      }
    }

    if (toRecord.length > 0) {
      const updated = game.pois.map(p => {
        if (!toRecord.includes(p.id)) return p;
        const newCount = (p.visitCount ?? 0) + 1;
        toast({
          title: `📍 已記錄造訪：${p.name}`,
          description: `第 ${newCount} 次造訪！待滿一小時計入記錄。`,
        });
        return { ...p, visitCount: newCount, lastVisitedAt: new Date().toISOString() };
      });
      game.updatePois(updated);
    }
  }, [position, game.pois, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartQuiz = (poi: PointOfInterest) => {
    const askedQuestionHistory: AskedQuestionHistory = game.askedQuestions ?? {};
    const previousQuestions = askedQuestionHistory[poi.district] || [];

    const poiWithPreviousQuestions = { ...poi, previousQuestions };
    setActiveQuizPoi(poiWithPreviousQuestions);
  };

  const handleStartLocalChallenge = async () => {
    if (!position) return;
    const areaInfo = await getAreaNameFromPosition(position);

    if (areaInfo && areaInfo.fullAddress && areaInfo.district) {
        setCurrentArea(areaInfo);

        const askedQuestionHistory: AskedQuestionHistory = game.askedQuestions ?? {};
        const previousQuestions = askedQuestionHistory[areaInfo.district] || [];

        const localPoi: PointOfInterest = {
            id: `local-${Date.now()}`,
            name: '目前位置',
            position: position,
            areaDescription: `關於台灣${areaInfo.fullAddress}的介紹`,
            discovered: true,
            county: areaInfo.county,
            district: areaInfo.district,
            previousQuestions: previousQuestions,
        };
        setActiveQuizPoi(localPoi);
    } else {
        toast({ title: "無法識別位置", description: "無法獲取您目前位置的詳細地址。", variant: "destructive" });
    }
  };

  const handleToggleChatbot = async () => {
    if (isChatbotOpen) {
      setIsChatbotOpen(false);
      return;
    }

    if (!position) return;
    setIsChatbotLoading(true);
    const areaInfo = await getAreaNameFromPosition(position);
    if (areaInfo && areaInfo.fullAddress) {
      setChatbotLocationName(areaInfo.fullAddress);
      setIsChatbotOpen(true);
    } else {
      toast({ title: '無法識別位置', description: '無法獲取您目前位置的詳細地址。', variant: 'destructive' });
    }
    setIsChatbotLoading(false);
  };

  const handleOpenGuide = async () => {
    if (!position) return;
    setIsGuideLoading(true);
    setGuideData(null);
    setIsGuideModalOpen(true);

    try {
        const areaInfo = await getAreaNameFromPosition(position);
        if (!areaInfo || !areaInfo.fullAddress) {
            toast({ title: "無法識別位置", description: "無法獲取您目前位置的詳細地址。", variant: "destructive" });
            setIsGuideModalOpen(false);
            return;
        }

        const result = await generateLocationIntroAction({ locationName: areaInfo.fullAddress });
        if (result) {
            setGuideData(result);
        } else {
            toast({ title: "AI 指南生成失敗", description: "抱歉，無法為您目前的位置生成語音導覽。", variant: "destructive" });
            setIsGuideModalOpen(false);
        }
    } catch (error) {
        console.error("Error generating location intro:", error);
        toast({ title: "發生錯誤", description: "生成語音導覽時發生問題。", variant: "destructive" });
        setIsGuideModalOpen(false);
    } finally {
        setIsGuideLoading(false);
    }
  };

  const handleCloseQuiz = () => {
    setActiveQuizPoi(null);
  };

  const renderMapComponent = () => {
    if (loading && !position) {
      return <Skeleton className="h-full w-full" />
    }

    if (error && !position) {
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

    if (!googleMapsApiKey) {
      return (
        <div className="p-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>缺少 Google Maps API 金鑰</AlertTitle>
            <AlertDescription>
              請提供您的 Google Maps API 金鑰以顯示地圖。
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
       <GameMap
        apiKey={googleMapsApiKey}
        userPosition={position}
        defaultCenter={TAIPEI_CENTER}
        pois={game.pois}
        path={path}
        trips={game.trips}
        trails={game.trails}
        onStartQuiz={handleStartQuiz}
        fogOpacity={game.settings?.fogOpacity ?? 70}
        cityPoints={game.cityPoints}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-1 p-4 font-headline text-2xl font-bold text-primary">
        <Link href="/welcome" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <MapPin className="h-6 w-6" />
          <h1>AI 城市導遊</h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToggleChatbot}
            disabled={!position || isChatbotLoading}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Sparkles />
          </Button>
          <Button
            onClick={handleOpenGuide}
            disabled={!position || isGuideLoading}
            size="icon"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Mic />
          </Button>
          <Button
              onClick={handleStartLocalChallenge}
              disabled={!position}
              size="icon"
              className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Trophy />
          </Button>
          {!isTracking ? (
            <Button onClick={handleStartTracking} disabled={loading} size="icon">
              <Play />
            </Button>
          ) : (
            <Button onClick={handleStopTracking} variant="destructive" size="icon">
              <Square />
            </Button>
          )}
        </div>
      </header>

      <DailyGoalCard refreshTrigger={goalRefresh} />

      <div className="relative flex-1 bg-muted">
        {renderMapComponent()}
        <Chatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          locationName={chatbotLocationName}
        />
      </div>

      <div className="p-2 border-t-2 border-primary/20 bg-background">
        <StatusBar />
      </div>

      <QuizModal
        poi={activeQuizPoi}
        isOpen={!!activeQuizPoi}
        onClose={handleCloseQuiz}
        onQuizComplete={game.addXp}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        guideData={guideData}
        isLoading={isGuideLoading}
       />
    </div>
  );
}
