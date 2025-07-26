'use client';

import * as React from 'react';
import { Building, MapPin, Search } from 'lucide-react';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import { PoiList } from '@/components/PoiList';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PoisPage() {
  const { position, loading, error } = useLocationTracker();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="p-4 space-y-4">
        <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
          <Building className="h-6 w-6" />
          <h2>附近景點</h2>
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
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
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
          <p className="text-muted-foreground mt-2">請檢查您的網路連線以搜尋附近的景點。</p>
        </div>
      );
    }

    if (position) {
      return <PoiList position={position} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/50 rounded-lg">
        <MapPin className="w-16 h-16 mx-auto text-accent" />
        <h3 className="text-2xl font-bold mt-4">無法取得您的位置</h3>
        <p className="text-muted-foreground mt-2">請允許位置存取權限以尋找附近的景點。</p>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <Building className="h-6 w-6" />
        <h2>附近景點</h2>
      </header>
      {renderContent()}
    </div>
  );
}
