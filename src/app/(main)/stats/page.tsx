'use client';

import { BarChart2, TrendingUp, History, Percent } from 'lucide-react';

export default function StatsPage() {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <BarChart2 className="h-6 w-6" />
        <h2>Your Stats</h2>
      </header>
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <Percent className="w-16 h-16 mx-auto text-accent" />
        <h3 className="text-4xl font-bold mt-4">Coming Soon</h3>
        <p className="text-muted-foreground mt-2">Exploration percentage and historical charts will be available here.</p>
      </div>
    </div>
  );
}
