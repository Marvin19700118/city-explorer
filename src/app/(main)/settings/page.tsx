
'use client';

import * as React from 'react';
import { Settings, Bell, Palette, LogIn, LogOut, Cloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import type { Settings as AppSettings } from '@/lib/types';


export default function SettingsPage() {
  const [settings, setSettings] = React.useState<AppSettings>({
    fogOpacity: 70,
    areaNotifications: true,
  });
  const [isClient, setIsClient] = React.useState(false);
  const { isSignedIn, signIn, signOut } = useAuth();
  const signInButtonRef = React.useRef(null);

  React.useEffect(() => {
    setIsClient(true);
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);
  
  React.useEffect(() => {
    if (isClient && !isSignedIn && signInButtonRef.current && window.google) {
      window.google.accounts.id.renderButton(
        signInButtonRef.current,
        { theme: "outline", size: "large", type: 'standard' } 
      );
    }
  }, [isClient, isSignedIn]);


  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <Settings className="h-6 w-6" />
        <h2>設定</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>雲端同步</CardTitle>
          <CardDescription>登入您的 Google 帳戶以同步您的遊戲進度。</CardDescription>
        </CardHeader>
        <CardContent>
          {isSignedIn ? (
            <div className="space-y-4">
              <p>已登入 Google 帳戶。</p>
              <Button onClick={signOut} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                登出
              </Button>
            </div>
          ) : (
             <div ref={signInButtonRef} />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>地圖</CardTitle>
          <CardDescription>自訂您的地圖體驗</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fog-opacity" className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span>戰爭迷霧不透明度</span>
                </div>
                <span>{settings.fogOpacity}%</span>
            </Label>
            <Slider
              id="fog-opacity"
              min={0}
              max={80}
              step={1}
              value={[settings.fogOpacity]}
              onValueChange={(value) => handleSettingsChange('fogOpacity', value[0])}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>通知</CardTitle>
          <CardDescription>管理應用程式內的通知</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="area-notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>新區域探索通知 (3公里)</span>
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
