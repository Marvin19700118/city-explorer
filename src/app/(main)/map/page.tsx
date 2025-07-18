
'use client';

import * as React from 'react';
import { MapPin, Play, Square, Trophy, Mic } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { GameMap } from '@/components/Map';
import { QuizModal } from '@/components/QuizModal';
import { GuideModal } from '@/components/GuideModal';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import type { Pet, PointOfInterest, Trip, GuideData, Settings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { createGuide } from '@/app/actions';

const TAIPEI_CENTER = { lat: 25.0330, lng: 121.5654 };

const initialPois: PointOfInterest[] = [
  { id: 'poi1', name: '台北101', position: { lat: 25.0339, lng: 121.5645 }, areaDescription: '一座位於台灣台北市信義區的摩天大樓。樓高509.2公尺，地上101層、地下5層，總樓地板面積37萬4千平方公尺，由李祖原聯合建築師事務所設計。於1999年動工，2004年12月31日完工開幕。', discovered: false, county: '台北市' },
  { id: 'poi2', name: '國立故宮博物院', position: { lat: 25.1026, lng: 121.5485 }, areaDescription: '位於台灣台北市士林區，為台灣最具規模的博物館以及台灣八景之一，也是古代中國藝術史與漢學研究機構。館舍在1965年11月12日落成。', discovered: false, county: '台北市' },
  { id: 'poi3', name: '中正紀念堂', position: { lat: 25.0345, lng: 121.5218 }, areaDescription: '為紀念中華民國第一任總統蔣中正而興建，是位於臺灣臺北市中正區的國家紀念建築。全區250,000平方公尺，主樓高76公尺。', discovered: false, county: '台北市' },
  { id: 'poi4', name: '西門町', position: { lat: 25.0479, lng: 121.5074 }, areaDescription: '位於臺灣臺北市萬華區東北方，為臺北市西區最重要且國際化程度最高的消費商圈，以年輕族群為主要的消費對象，並吸引了許多國際觀光客以自助旅行造訪此處。', discovered: false, county: '台北市' },
];

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


const XP_PER_KM = 100;
const PET_EVOLUTION_LEVELS = [5, 10, 15];

export default function MapPage() {
  const { position, distance, path, error, loading, isTracking, startTracking, stopTracking: trackerStop } = useLocationTracker();
  const { toast } = useToast();
  
  const [totalDistance, setTotalDistance] = React.useState(0);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const tripStartTimeRef = React.useRef<string | null>(null);
  const prevPetRef = React.useRef<Pet>();

  const [pet, setPet] = React.useState<Pet>({
    name: 'Sparky',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    evolutionStage: 1,
  });

  const [pois, setPois] = React.useState<PointOfInterest[]>([]);
  const [activeQuizPoi, setActiveQuizPoi] = React.useState<PointOfInterest | null>(null);
  
  const [guideData, setGuideData] = React.useState<GuideData | null>(null);
  const [isGuideLoading, setIsGuideLoading] = React.useState(false);
  
  const [settings, setSettings] = React.useState<Settings>({
    fogOpacity: 50,
    areaNotifications: true,
  });
  
  const googleMapsApiKey = "AIzaSyBqo8q0xhqqh3TZVYm7GKFijtbJz2lE-RM";

  const handleStartTracking = () => {
    tripStartTimeRef.current = new Date().toISOString();
    startTracking();
  }

  const stopTracking = () => {
    if (path.length > 1 && distance > 0.01) { // only save meaningful trips
      const newTrip: Trip = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        distance: distance,
        path: path,
        startTime: tripStartTimeRef.current,
        endTime: new Date().toISOString(),
      };
      const existingTripsJSON = localStorage.getItem('trips');
      const existingTrips: Trip[] = existingTripsJSON ? JSON.parse(existingTripsJSON) : [];
      const updatedTrips = [...existingTrips, newTrip];
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips); // Update state to re-render map
      toast({
        title: "旅程已儲存!",
        description: `您 ${distance.toFixed(2)} 公里的旅程已被儲存到紀錄中。`,
      });
      setTotalDistance(prev => prev + distance);
    }
    trackerStop();
    tripStartTimeRef.current = null;
  };

  const addXp = React.useCallback((amount: number) => {
    setPet(p => ({ ...p, xp: p.xp + amount }));
  }, []);


  React.useEffect(() => {
    // Load saved data from localStorage on mount
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
    }
    const savedPois = localStorage.getItem('pois');
    if (savedPois) {
      setPois(JSON.parse(savedPois));
    } else {
      setPois(initialPois);
    }
    
    const existingTripsJSON = localStorage.getItem('trips');
    if (existingTripsJSON) {
        const existingTrips: Trip[] = JSON.parse(existingTripsJSON);
        setTrips(existingTrips);
        const savedTotalDistance = existingTrips.reduce((acc, trip) => acc + trip.distance, 0);
        setTotalDistance(savedTotalDistance);
    } else {
        // If no trips exist, add the mock trip
        const initialTrips = [mockTrip];
        localStorage.setItem('trips', JSON.stringify(initialTrips));
        setTrips(initialTrips);
        setTotalDistance(mockTrip.distance);
    }
    
    const savedPet = localStorage.getItem('pet');
    if (savedPet) {
        setPet(JSON.parse(savedPet));
    }
  }, []);


  React.useEffect(() => {
    // This effect runs whenever totalDistance or distance changes, calculating XP from distance
    const distanceXp = (totalDistance + distance) * XP_PER_KM;
    setPet(currentPet => ({...currentPet, xp: distanceXp}));
  }, [distance, totalDistance]);


  React.useEffect(() => {
    // This effect handles level ups based on XP changes.
    // It calculates the new level and evolution state.
    const currentPet = pet;
    let currentXp = currentPet.xp;
    let currentLevel = 1;
    let xpForNext = 100;
    let currentEvolutionStage = 1;

    // Recalculate level from base XP
    while (currentXp >= xpForNext) {
        currentXp -= xpForNext;
        currentLevel++;
        xpForNext = Math.floor(xpForNext * 1.5);
        
        const newEvolutionStage = PET_EVOLUTION_LEVELS.filter(l => currentLevel >= l).length + 1;
        if (newEvolutionStage > currentEvolutionStage) {
            currentEvolutionStage = newEvolutionStage;
        }
    }

    const finalPetState: Pet = {
        ...currentPet,
        xp: Math.round(currentXp),
        level: currentLevel,
        xpToNextLevel: xpForNext,
        evolutionStage: currentEvolutionStage,
    };

    // Only update state if something has actually changed to avoid infinite loops
    if (finalPetState.level !== currentPet.level || finalPetState.evolutionStage !== currentPet.evolutionStage || finalPetState.xp !== currentPet.xp) {
        setPet(finalPetState);
        localStorage.setItem('pet', JSON.stringify(finalPetState));
    }

  }, [pet.xp]);

  // Separate effect for showing toast notifications on level/evolution change
  React.useEffect(() => {
    // use a ref to track the previous state to compare against
    if (prevPetRef.current) {
        const prevPet = prevPetRef.current;
        if (pet.evolutionStage > prevPet.evolutionStage) {
            toast({
                title: "您的寵物進化了！",
                description: `${pet.name} 已經達到了新的形態！`,
            });
        } else if (pet.level > prevPet.level) {
            toast({
                title: "等級提升！",
                description: `${pet.name} 現在是 ${pet.level} 級了！`,
            });
        }
    }
    
    // update the ref with the current pet state for the next render
    prevPetRef.current = pet;
  }, [pet.level, pet.evolutionStage, pet.name, toast]);

  React.useEffect(() => {
    if (!position || !isTracking || pois.length === 0) return;
      
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
      
    const DISCOVERY_RADIUS_KM = settings.areaNotifications ? 3 : 0.5; // 3km or 500m
    let updatedPois = pois;
    let didDiscover = false;

    const undiscoveredPois = updatedPois.filter(p => !p.discovered);

    for (const poi of undiscoveredPois) {
      const dist = getDistanceInKm(poi.position, position);

      if (dist < DISCOVERY_RADIUS_KM) {
        updatedPois = updatedPois.map(p => p.id === poi.id ? { ...p, discovered: true } : p);
        didDiscover = true;
        toast({
            title: "發現新區域！",
            description: `您已揭開 ${poi.name} 的面紗。`,
            variant: "default",
        });
      }
    }
    
    if (didDiscover) {
        setPois(updatedPois);
        localStorage.setItem('pois', JSON.stringify(updatedPois));
    }
  }, [position, pois, toast, isTracking, settings.areaNotifications]);

  const handleStartQuiz = (poi: PointOfInterest) => {
    setActiveQuizPoi(poi);
  };

  const getAreaNameFromPosition = async (pos: {lat: number, lng: number}): Promise<string | null> => {
     if (!googleMapsApiKey || !window.google) return null;
     try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: pos });
        
        if (response.results && response.results[0]) {
            // Find a descriptive name for the area
            return response.results.find(r => r.types.includes('locality'))?.formatted_address || 
                   response.results[0].formatted_address;
        }
        return null;
     } catch (err) {
        console.error("Reverse geocoding failed", err);
        return null;
     }
  }
  
  const handleStartLocalChallenge = async () => {
    if (!position) return;
    const areaName = await getAreaNameFromPosition(position);
    
    if (areaName) {
        const localPoi: PointOfInterest = {
            id: `local-${Date.now()}`,
            name: '目前位置',
            position: position,
            areaDescription: `使用者目前位於 ${areaName} 附近。`,
            discovered: true,
            county: '目前位置',
        };
        setActiveQuizPoi(localPoi);
    } else {
        toast({ title: "無法識別位置", description: "無法獲取您目前位置的詳細地址。", variant: "destructive" });
    }
  };

  const handleLocalGuide = async () => {
    if (!position) return;

    setIsGuideLoading(true);
    setGuideData(null);
    const areaName = await getAreaNameFromPosition(position);
    if (!areaName) {
         toast({ title: "無法識別位置", description: "無法獲取您目前位置的詳細地址。", variant: "destructive" });
         setIsGuideLoading(false);
         return;
    }
    
    const result = await createGuide(areaName);
    setIsGuideLoading(false);

    if (result) {
        setGuideData(result);
    } else {
        toast({ title: "導覽生成失敗", description: "無法為此區域生成導覽。", variant: "destructive" });
    }
  }

  const handleCloseQuiz = () => {
    setActiveQuizPoi(null);
  };


  const renderMapContent = () => {
    if (!googleMapsApiKey) {
      return (
        <div className="p-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>缺少 Google Maps API 金鑰</AlertTitle>
            <AlertDescription>
              請將您的 Google Maps API 金鑰加入到 .env 檔案中以顯示地圖。
            </AlertDescription>
          </Alert>
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

    if (loading) {
       return <Skeleton className="h-full w-full" />
    }
    
    return (
       <GameMap
        apiKey={googleMapsApiKey}
        userPosition={position}
        defaultCenter={TAIPEI_CENTER}
        pois={pois}
        path={path}
        trips={trips}
        onStartQuiz={handleStartQuiz}
        fogOpacity={settings.fogOpacity}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-1 p-4 font-headline text-2xl font-bold text-primary">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            <h1>城市探險家</h1>
          </div>
          <div className="flex items-center gap-2">
             <Button
                onClick={handleLocalGuide}
                disabled={!position || isGuideLoading}
                size="icon"
                className="bg-sky-500 hover:bg-sky-600 text-white"
             >
                <Mic />
             </Button>
             <Button 
                onClick={handleStartLocalChallenge} 
                disabled={!position} 
                size="icon"
                className="bg-accent hover:bg-accent/90"
             >
              <Trophy />
            </Button>
            {!isTracking ? (
              <Button onClick={handleStartTracking} disabled={loading} size="icon">
                <Play />
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" size="icon">
                <Square />
              </Button>
            )}
          </div>
        </header>

        <div className="relative flex-1">
          {renderMapContent()}
        </div>

        <div className="border-t-2 border-primary/20 p-2">
          <StatusBar distance={distance} pet={pet} />
        </div>
      <QuizModal
        poi={activeQuizPoi}
        isOpen={!!activeQuizPoi}
        onClose={handleCloseQuiz}
        onQuizComplete={addXp}
      />
      <GuideModal
        data={guideData}
        isOpen={!!guideData}
        isLoading={isGuideLoading}
        onClose={() => setGuideData(null)}
      />
    </div>
  );
}
