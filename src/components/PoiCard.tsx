'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PoiCardProps {
  place: google.maps.places.PlaceResult & { distance?: number };
}

export const PoiCard: React.FC<PoiCardProps> = ({ place }) => {
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || 'https://placehold.co/400x400.png';
  
  const openInGoogleMaps = () => {
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`, '_blank');
    }
  }

  return (
    <Card 
        className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={openInGoogleMaps}
    >
      <CardContent className="p-0 flex gap-3">
        <div className="relative w-28 h-28 flex-shrink-0">
          <Image
            src={photoUrl}
            alt={place.name || 'Point of Interest'}
            layout="fill"
            objectFit="cover"
            className="rounded-l-lg"
          />
        </div>
        <div className="py-3 pr-3 flex-1 flex flex-col justify-between">
            <div>
                 <h3 className="font-bold font-headline text-base line-clamp-2 leading-tight">
                    {place.name}
                </h3>
                {place.distance !== undefined && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3"/>
                        距離約 {place.distance.toFixed(0)} 公尺
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 text-sm mt-2">
                {place.rating && (
                    <Badge variant="outline" className="gap-1 border-amber-500/50">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-amber-600">{place.rating.toFixed(1)}</span>
                    </Badge>
                )}
                {place.types && place.types[0] && (
                    <Badge variant="secondary">
                        {place.types[0].replace(/_/g, ' ')}
                    </badge>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
