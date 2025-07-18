'use client';

import { Settings, Bell, Share2, Languages, Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <Settings className="h-6 w-6" />
        <h2>Settings</h2>
      </header>
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <Bell className="w-16 h-16 mx-auto text-accent" />
        <h3 className="text-4xl font-bold mt-4">Coming Soon</h3>
        <p className="text-muted-foreground mt-2">App settings like notifications, language, and privacy will be available here.</p>
      </div>
    </div>
  );
}
