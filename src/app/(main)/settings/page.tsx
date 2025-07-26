
'use client';

import * as React from 'react';
import { Settings, Bell, Palette, Share2, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { Settings as AppSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';


export default function SettingsPage() {
  const [settings, setSettings] = React.useState<AppSettings>({
    fogOpacity: 70,
    areaNotifications: true,
  });
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

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
  
  const handleCopyLink = () => {
    const url = 'https://studio--city-unveiler.us-central1.hosted.app/';
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: '連結已複製！',
        description: '快分享給您的朋友吧！',
      });
    }, (err) => {
      toast({
        title: '複製失敗',
        description: '無法將連結複製到剪貼簿。',
        variant: 'destructive',
      });
      console.error('Could not copy text: ', err);
    });
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
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            分享給朋友
          </CardTitle>
          <CardDescription>分享應用程式連結，邀請朋友一起來探索城市！</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
           <Input
            readOnly
            value="https://studio--city-unveiler.us-central1.hosted.app/"
            className="bg-muted/50"
          />
          <Button onClick={handleCopyLink} size="icon" variant="outline">
            <Copy className="h-4 w-4" />
            <span className="sr-only">複製連結</span>
          </Button>
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
