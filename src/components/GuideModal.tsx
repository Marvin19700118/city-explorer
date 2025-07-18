'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Mic, Volume2 } from 'lucide-react';
import type { GuideData } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';

type GuideModalProps = {
  data: GuideData | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
};

export const GuideModal = ({ data, isOpen, isLoading, onClose }: GuideModalProps) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (isOpen && data && audioRef.current) {
        audioRef.current.src = data.audioDataUri;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [isOpen, data]);

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (!data) return null;

    return (
      <>
        <ScrollArea className="h-64 pr-4">
            <p className="whitespace-pre-wrap">{data.guideText}</p>
        </ScrollArea>
        <audio ref={audioRef} controls className="w-full mt-4">
            <source src={data.audioDataUri} type="audio/wav" />
            Your browser does not support the audio element.
        </audio>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
            <Volume2 /> AI 在地解說
          </DialogTitle>
          <DialogDescription>
            聆聽 AI 為您介紹此處的風土人情。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderContent()}</div>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
