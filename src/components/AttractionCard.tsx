
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, BrainCircuit, Sparkles, FileText, Loader2, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateAttractionInfo as generateAttractionInfoAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { GenerateAttractionInfoOutput, QuizData } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { QuizModal } from './QuizModal';

interface AttractionCardProps {
  place: google.maps.places.PlaceResult & { distance?: number };
  onQuizComplete: (xpGained: number, county: string, district: string) => void;
  county: string;
  district: string;
}

export const AttractionCard: React.FC<AttractionCardProps> = ({ place, onQuizComplete, county, district }) => {
  const { toast } = useToast();
  const [attractionInfo, setAttractionInfo] = React.useState<GenerateAttractionInfoOutput | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = React.useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || 'https://placehold.co/400x400.png';
  
  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`, '_blank');
    }
  }

  const handleGenerateInfo = async () => {
    if (!place.name || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateAttractionInfoAction({ 
        attractionName: place.name,
        attractionAddress: place.vicinity || ''
      });
      if (result) {
        setAttractionInfo(result);
        return result;
      } else {
        toast({ title: "資訊產生失敗", description: "無法為此景點產生介紹與問答。", variant: "destructive" });
        return null;
      }
    } catch (error) {
       toast({ title: "發生錯誤", description: "產生景點資訊時發生問題。", variant: "destructive" });
       return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowIntro = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (attractionInfo) {
      setIsIntroModalOpen(true);
    } else {
      const info = await handleGenerateInfo();
      if (info) {
        setIsIntroModalOpen(true);
      }
    }
  };
  
  React.useEffect(() => {
    if (isIntroModalOpen && attractionInfo?.audioDataUri && audioRef.current) {
        audioRef.current.src = attractionInfo.audioDataUri;
        audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
    }
  }, [isIntroModalOpen, attractionInfo]);


  const handleStartQuiz = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (attractionInfo) {
        setIsQuizModalOpen(true);
    } else {
        const info = await handleGenerateInfo();
        if (info) {
            setIsQuizModalOpen(true);
        }
    }
  };

  const poiForQuiz = {
    id: place.place_id || `attraction-${Date.now()}`,
    name: place.name || '景點',
    position: { lat: place.geometry?.location?.lat() || 0, lng: place.geometry?.location?.lng() || 0 },
    areaDescription: `關於 ${place.name} 的問答`,
    discovered: true,
    county,
    district
  };

  return (
    <>
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
                            距離約 {(place.distance / 1000).toFixed(1)} 公里
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
          
          <div className="p-2 border-t bg-muted/30 grid grid-cols-3 gap-2">
             <Button variant="ghost" size="sm" onClick={handleShowIntro} disabled={isGenerating}>
              {isGenerating && !attractionInfo ? <Loader2 className="animate-spin" /> : <Mic />}
                AI 介紹
             </Button>
             <Button variant="ghost" size="sm" onClick={handleStartQuiz} disabled={isGenerating}>
              {isGenerating && !attractionInfo ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                趣味問答
             </Button>
             <Button variant="ghost" size="sm" onClick={openInGoogleMaps}>
                <MapPin />
                地圖導航
             </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Introduction Modal */}
      <Dialog open={isIntroModalOpen} onOpenChange={setIsIntroModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
              <Sparkles /> {place.name}
            </DialogTitle>
            <DialogDescription>
              由 AI tour guide 為您產生的專屬介紹
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-foreground leading-relaxed">
                {attractionInfo?.introduction || "正在生成介紹..."}
            </p>
            {attractionInfo?.audioDataUri && (
                <audio ref={audioRef} controls className="w-full">
                    <source src={attractionInfo.audioDataUri} type="audio/wav" />
                    您的瀏覽器不支援音訊播放。
                </audio>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Quiz Modal */}
      {isQuizModalOpen && attractionInfo?.quiz && (
        <QuizModal
            poi={poiForQuiz}
            isOpen={isQuizModalOpen}
            onClose={() => setIsQuizModalOpen(false)}
            onQuizComplete={onQuizComplete}
            overrideQuizData={{ questions: attractionInfo.quiz }}
        />
      )}
    </>
  );
};
