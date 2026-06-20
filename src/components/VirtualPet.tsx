
'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/context/FirebaseGameContext';

type PetStage = {
  name: string;
  emoji: string;
  minXp: number;
};

const PET_STAGES: PetStage[] = [
  { name: '神秘蛋', emoji: '🥚', minXp: 0 },
  { name: '小幼苗', emoji: '🌱', minXp: 100 },
  { name: '城市探險家', emoji: '🐣', minXp: 500 },
  { name: '城市行家', emoji: '🦅', minXp: 1000 },
  { name: '都市守護者', emoji: '🦁', minXp: 2500 },
];

function getPetInfo(totalXp: number) {
  const currentIdx = PET_STAGES.reduce((best, _stage, i) => totalXp >= PET_STAGES[i].minXp ? i : best, 0);
  const current = PET_STAGES[currentIdx];
  const next = currentIdx < PET_STAGES.length - 1 ? PET_STAGES[currentIdx + 1] : null;
  const progress = next
    ? Math.min(100, Math.floor(((totalXp - current.minXp) / (next.minXp - current.minXp)) * 100))
    : 100;
  return { current, next, progress };
}

export function VirtualPet() {
  const game = useGame();
  const totalXp = Object.values(game.cityPoints).reduce((sum, v) => sum + (v || 0), 0);

  const { current, next, progress } = getPetInfo(totalXp);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span>🐾</span> 探索夥伴
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="text-6xl select-none animate-pulse">{current.emoji}</div>
          <div className="flex-1 space-y-1">
            <p className="font-bold text-primary text-lg">{current.name}</p>
            <p className="text-sm text-muted-foreground">總探索 XP：{totalXp}</p>
            {next ? (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  距離進化「{next.name} {next.emoji}」還需 {next.minXp - totalXp} XP
                </p>
              </>
            ) : (
              <p className="text-xs text-primary font-semibold">已達最高進化！🎉</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
