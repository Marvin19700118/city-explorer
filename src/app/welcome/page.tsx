'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Map, BrainCircuit, Utensils, Gem, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomePage() {
  const router = useRouter();

  const handleStart = () => {
    try {
        localStorage.setItem('hasVisited', 'true');
    } catch (e) {
        console.error("Could not set hasVisited in localStorage", e);
    }
    router.push('/map');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-body text-foreground">
      <div className="relative mx-auto flex h-auto max-h-[90vh] w-full max-w-sm flex-col overflow-auto rounded-2xl border-4 border-primary/50 bg-background shadow-2xl shadow-primary/20 p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block rounded-full bg-primary/20 p-4 text-primary">
            <Sparkles className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            歡迎來到城市探險家
          </h1>
          <p className="text-muted-foreground">
            一個結合真實世界探索與在地知識問答的尋寶遊戲。
          </p>
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">核心功能</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-4">
              <Map className="h-6 w-6 mt-1 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-semibold">地圖探索</h3>
                <p className="text-muted-foreground text-xs">在真實世界中移動，揭開地圖上的戰爭迷霧，發現新的興趣點。</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <BrainCircuit className="h-6 w-6 mt-1 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-semibold">在地挑戰</h3>
                <p className="text-muted-foreground text-xs">回答關於您周遭環境的 AI 問答，測試您的在地知識並贏得經驗值。</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <Utensils className="h-6 w-6 mt-1 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-semibold">美食搜尋</h3>
                <p className="text-muted-foreground text-xs">尋找您附近的高評價餐廳，並讓 AI 為您產生獨特的餐廳簡介。</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Gem className="h-6 w-6 mt-1 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-semibold">成就系統</h3>
                <p className="text-muted-foreground text-xs">在各個城市累積經驗值，提升您的等級並解鎖專屬頭銜。</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleStart} size="lg" className="w-full">
          開始使用
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
