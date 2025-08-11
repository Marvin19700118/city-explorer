
'use client';

import * as React from 'react';
import { Landmark, MapPin, Search } from 'lucide-react';
import { useLocation } from '@/context/LocationTrackingContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AttractionList } from '@/components/AttractionList';
import { Button } from '@/components/ui/button';

export default function AttractionsPage() {
  const { position, loading, error } = useLocation();
  const [isClient, setIsClient] = React.useState(false);
  const [places, setPlaces] = React.useState<(google.maps.places.PlaceResult & { distance?: number })[] | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = async (searchFn: () => Promise<(google.maps.places.PlaceResult & { distance?: number })[]>) => {
    setIsSearching(true);
    setPlaces(null);
    const results = await searchFn();
    setPlaces(results);
    setIsSearching(false);
  };

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
    if (loading) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/50 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto text-accent animate-pulse" />
          <h3 className="text-2xl font-bold mt-4">正在取得您的位置...</h3>
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
    
    if (isSearching) {
       return (
          <div className="space-y-3 p-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        );
    }

    if (places && places.length === 0) {
       return (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-accent" />
          <h3 className="text-2xl font-bold mt-4">找不到附近的熱門景點</h3>
          <p className="text-muted-foreground mt-2">試著移動到其他地方或稍後再試。</p>
        </div>
      );
    }

    if (places) {
        return <AttractionList places={places} />;
    }

    // Default state: show button if we have a position
    if (position) {
       return (
          <AttractionList onSearch={(searchFn) => handleSearch(searchFn)} />
       );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/50 rounded-lg">
        <MapPin className="w-16 h-16 mx-auto text-accent" />
        <h3 className="text-2xl font-bold mt-4">無法取得您的位置</h3>
        <p className="text-muted-foreground mt-2">請允許位置存取權限以尋找附近的熱門景點。</p>
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
