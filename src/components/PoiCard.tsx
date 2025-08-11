
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Search, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateRestaurantDescription as generateDescriptionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface PoiCardProps {
  place: google.maps.places.PlaceResult & { distance?: number };
}

export const PoiCard: React.FC<PoiCardProps> = ({ place }) => {
  const { toast } = useToast();
  const [description, setDescription] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || 'https://placehold.co/400x400.png';
  
  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`, '_blank');
    }
  }

  const handleGenerateDescription = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!place.name || isGenerating || description) return;

    setIsGenerating(true);
    try {
      const result = await generateDescriptionAction({ 
        restaurantName: place.name,
        restaurantAddress: place.vicinity || ''
      });
      if (result?.description) {
        setDescription(result.description);
      } else {
        toast({ title: "簡介產生失敗", description: "無法為此餐廳產生介紹。", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "發生錯誤", description: "產生介紹時發生問題。", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const openWebSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.name) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(place.name + " " + (place.vicinity || ''))}`, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3">
          <div className="relative w-28 h-full flex-shrink-0">
             <img
              src={photoUrl}
              alt={place.name || 'Point of Interest'}
              className="w-full h-full object-cover rounded-l-lg"
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
                          距離約 {(place.distance).toFixed(1)} 公里
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
                      </Badge>
                  )}
              </div>
          </div>
        </div>
        {(description || isGenerating) && (
            <div className="p-3 border-t">
                 {isGenerating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        <span>AI 正在為您產生餐廳簡介...</span>
                    </div>
                 )}
                 {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                 )}
            </div>
        )}
        <div className="p-2 border-t bg-muted/30 grid grid-cols-3 gap-2">
           <Button variant="ghost" size="sm" onClick={openInGoogleMaps}>
              <MapPin />
              地圖
           </Button>
            <Button variant="ghost" size="sm" onClick={openWebSearch}>
                <Search />
                網路搜尋
            </Button>
           <Button variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating || !!description}>
            {description ? <FileText /> : (isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />)}
              AI 簡介
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};
