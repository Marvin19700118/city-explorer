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
import { Mic, Waves } from 'lucide-react';
import type { GenerateLocationIntroOutput } from '@/lib/types';

type GuideModalProps = {
  guideData: GenerateLocationIntroOutput | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
};

export const GuideModal = ({ guideData, isOpen, onClose, isLoading }: GuideModalProps) => {

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex items-center gap-2 pt-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      );
    }

    if (!guideData) return null;

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {guideData.introduction}
        </p>
        <audio controls className="w-full">
            <source src={guideData.audioDataUri} type="audio/wav" />
            您的瀏覽器不支援音訊播放。
        </audio>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
            <Mic /> {isLoading ? '生成中...' : 'AI 介紹'}
          </DialogTitle>
          <DialogDescription>
            讓 AI 帶您快速認識這個區域！
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderContent()}</div>
        <DialogFooter>
            <Button onClick={onClose} className="w-full">關閉</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
