'use client';

import * as React from 'react';
import { Settings, Bell, Palette, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/firebase/auth';
import type { Settings as AppSettings } from '@/lib/types';


export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = React.useState<AppSettings>({
    fogOpacity: 50,
    areaNotifications: true,
  });
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <Settings className="h-6 w-6" />
        <h2>Settings</h2>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <span id="email" className="font-mono text-sm">{user?.email}</span>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
          <CardDescription>Customize your map experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fog-opacity" className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span>Fog Opacity</span>
                </div>
                <span>{settings.fogOpacity}%</span>
            </Label>
            <Slider
              id="fog-opacity"
              min={30}
              max={70}
              step={1}
              value={[settings.fogOpacity]}
              onValueChange={(value) => handleSettingsChange('fogOpacity', value[0])}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage in-app notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="area-notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Area Discovery Notifications (3km)</span>
            </Label>
            <Switch
              id="area-notifications"
              checked={settings.areaNotifications}
              onCheckedChange={(checked) => handleSettingsChange('areaNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
