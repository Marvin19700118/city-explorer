
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from './ui/skeleton';
import { Mic, Waves } from 'lucide-react';
import type { GenerateLocationIntroOutput } from '@/lib/types';

type GuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  guideData: GenerateLocationIntroOutput | null;
};

export const GuideModal = ({ isOpen, onClose, isLoading, guideData }: GuideModalProps) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    // When a new audio source is provided, automatically play it.
    if (guideData?.audioDataUri && audioRef.current) {
        audioRef.current.src = guideData.audioDataUri;
        audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
    }
  }, [guideData]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl text-sky-500">
            <Mic /> AI Podcast
          </DialogTitle>
          <DialogDescription>
            聆聽關於您目前所在地的在地故事。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex justify-center pt-4">
                 <Waves className="h-10 w-10 text-sky-500 animate-pulse" />
              </div>
            </div>
          )}
          {guideData && !isLoading && (
            <div className="space-y-4">
              <p className="text-foreground leading-relaxed">
                {guideData.introduction}
              </p>
              <audio ref={audioRef} controls className="w-full">
                <source src={guideData.audioDataUri} type="audio/wav" />
                您的瀏覽器不支援音訊播放。
              </audio>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
