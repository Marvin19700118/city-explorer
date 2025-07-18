'use client';

import { Gem, Shield, Star } from 'lucide-react';

export default function AchievementsPage() {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <Gem className="h-6 w-6" />
        <h2>Achievements</h2>
      </header>
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <Star className="w-16 h-16 mx-auto text-accent" />
        <h3 className="text-4xl font-bold mt-4">Coming Soon</h3>
        <p className="text-muted-foreground mt-2">Your pet inventory and badges will be displayed here.</p>
      </div>
    </div>
  );
}
