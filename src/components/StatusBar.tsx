
import { Footprints, MapPin, Gauge } from 'lucide-react';
import { useLocation } from '@/context/LocationTrackingContext';
import { Card } from './ui/card';

export const StatusBar = () => {
  const { distance, currentArea, speed } = useLocation();
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="flex flex-col items-center justify-center rounded-lg p-3 text-center border">
        <div className="flex items-center gap-1">
          <Footprints className="h-4 w-4 text-accent" />
          <span className="text-xs text-muted-foreground">已探索</span>
        </div>
        <p className="font-headline text-xl font-bold text-foreground">
          {distance.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">km</span>
        </p>
      </Card>

      <Card className="flex flex-col items-center justify-center rounded-lg p-3 text-center border">
        <div className="flex items-center gap-1">
          <Gauge className="h-4 w-4 text-blue-400" />
          <span className="text-xs text-muted-foreground">目前速度</span>
        </div>
        <p className="font-headline text-xl font-bold text-foreground">
          {speed != null ? speed.toFixed(1) : '--'}{' '}
          <span className="text-sm font-normal text-muted-foreground">km/h</span>
        </p>
      </Card>

      <Card className="flex flex-col items-center justify-center rounded-lg p-3 text-center h-full border">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">位置</span>
        </div>
        {currentArea ? (
          <div className="flex flex-col items-center">
            <p className="font-headline text-sm font-bold text-foreground leading-tight">
              {currentArea.village || currentArea.district}
            </p>
            <p className="text-xs text-muted-foreground">{currentArea.city}</p>
          </div>
        ) : (
          <p className="font-headline text-sm font-bold text-muted-foreground mt-1">定位中...</p>
        )}
      </Card>
    </div>
  );
};
