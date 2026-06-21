
'use client';

import * as React from 'react';
import { Settings as SettingsIcon, Languages, LogIn, LogOut, Download, Upload, AlertTriangle, Activity, BrainCircuit, Map, RotateCcw, ShieldCheck, UserX, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nContext';
import { useGame } from '@/context/FirebaseGameContext';
import type { GameSaveData } from '@/lib/types';
import { saveGameData } from '@/lib/db';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const GDRIVE_FILE_NAME = 'aitourguide.json';

export default function SettingsPage() {
  const { isSignedIn, gsiLoaded, tokenClient, getAccessToken, signOut } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isLinking, setIsLinking] = React.useState(false);
  const { i18n, setLocale, t } = useI18n();
  const game = useGame();

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      await game.linkWithGoogle();
      toast({ title: '已綁定 Google 帳號', description: '您的資料現在已與 Google 帳號連結，換裝置也不會遺失。' });
    } catch (e: any) {
      if (e.code === 'auth/credential-already-in-use') {
        toast({ title: '此 Google 帳號已被使用', description: '請試試「切換到已有 Google 帳號」。', variant: 'destructive' });
      } else {
        toast({ title: '綁定失敗', description: e.message, variant: 'destructive' });
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleSwitchToGoogle = async () => {
    if (!confirm('切換後會使用 Google 帳號的資料，目前的匿名資料將不再顯示。確定繼續？')) return;
    setIsLinking(true);
    try {
      await game.switchToGoogleAccount();
    } catch (e: any) {
      toast({ title: '切換失敗', description: e.message, variant: 'destructive' });
      setIsLinking(false);
    }
  };

  const handleResetCounters = async () => {
    await game.resetApiCounts();
    toast({ title: "計數器已重設", description: "API 呼叫次數已歸零。" });
  };


  const handleSignIn = () => {
    if (gsiLoaded && tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      toast({ title: t('settings.gdrive.gsiErrorTitle'), description: t('settings.gdrive.gsiErrorDescription'), variant: 'destructive' });
    }
  };

  const getFileId = async (accessToken: string): Promise<string | null> => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${GDRIVE_FILE_NAME}'&spaces=appDataFolder`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to search for file in Google Drive.' } }));
        throw new Error(`Failed to search for file: ${errorData.error.message}`);
    }
    const data = await response.json();
    return data.files.length > 0 ? data.files[0].id : null;
  }

  const handleSyncToCloud = async () => {
    if (!isSignedIn) {
        toast({ title: t('settings.gdrive.notSignedInTitle'), description: t('settings.gdrive.notSignedInDescription'), variant: 'destructive'});
        return;
    }
    setIsSyncing(true);
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Access Token not available");

        const saveData: GameSaveData = {
            pois: game.pois,
            trips: game.trips,
            cityPoints: game.cityPoints,
            settings: game.settings,
            lastUpdated: new Date().toISOString(),
        };

        const fileId = await getFileId(accessToken);
        const metadata = { name: GDRIVE_FILE_NAME, mimeType: 'application/json' };
        if (!fileId) {
            // @ts-ignore
            metadata.parents = ['appDataFolder'];
        }

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(saveData)], { type: 'application/json' }));

        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
        const method = fileId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: form,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to upload file: ${errorData.error.message}`);
        }

        toast({ title: t('settings.gdrive.syncSuccessTitle'), description: t('settings.gdrive.syncSuccessDescription')});

    } catch (error: any) {
        console.error("Sync error:", error);
        toast({ title: t('settings.gdrive.syncErrorTitle'), description: error.message, variant: 'destructive'});
    } finally {
        setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!isSignedIn) {
        toast({ title: t('settings.gdrive.notSignedInTitle'), description: t('settings.gdrive.notSignedInDescription'), variant: 'destructive'});
        return;
    }
     setIsSyncing(true);
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Access Token not available");

        const fileId = await getFileId(accessToken);
        if (!fileId) {
            toast({ title: t('settings.gdrive.restoreNoFileTitle'), description: t('settings.gdrive.restoreNoFileDescription'), variant: "destructive" });
            setIsSyncing(false);
            return;
        }

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: { message: 'Failed to download file from Google Drive.' } }));
             throw new Error(`Failed to download file: ${errorData.error.message}`);
        }

        const saveData: GameSaveData = await response.json();

        if (!game.uid) throw new Error("User not authenticated");

        // Restore pois and cityPoints/settings via Firebase
        await game.updatePois(saveData.pois || []);
        await saveGameData(game.uid, {
            cityPoints: saveData.cityPoints || {},
            settings: saveData.settings || game.settings,
        });
        // Restore trips
        for (const trip of (saveData.trips || [])) {
            await game.addTrip(trip);
        }

        toast({ title: t('settings.gdrive.restoreSuccessTitle'), description: `${t('settings.gdrive.restoreSuccessDescription')} ${new Date(saveData.lastUpdated).toLocaleString()}` });

        window.location.reload();

    } catch (error: any) {
         console.error("Restore error:", error);
        toast({ title: t('settings.gdrive.restoreErrorTitle'), description: error.message, variant: 'destructive'});
    } finally {
        setIsSyncing(false);
    }
  }

  const toggleLanguage = () => {
    const newLocale = i18n.locale === 'en' ? 'zh' : 'en';
    setLocale(newLocale);
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
        <SettingsIcon className="h-6 w-6" />
        <h2>{t('settings.title')}</h2>
      </header>

       <Card>
        <CardHeader>
          <CardTitle>API 使用統計</CardTitle>
          <CardDescription>追蹤應用程式中 Gemini 和 Places API 的累計呼叫次數。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <span className="font-medium">Gemini API 呼叫次數</span>
                </div>
                <span className="font-bold text-lg font-mono">{game.geminiApiCallCount}</span>
            </div>
             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <Map className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Places API 呼叫次數</span>
                </div>
                <span className="font-bold text-lg font-mono">{game.placesApiCallCount}</span>
            </div>
            <Button onClick={handleResetCounters} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                重設計數器
            </Button>
        </CardContent>
      </Card>

      {/* ── Google Account binding ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            帳號安全
          </CardTitle>
          <CardDescription>
            綁定 Google 帳號可確保換裝置或清除瀏覽器後資料不遺失。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {game.isAnonymous ? (
            <>
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-400">
                <UserX className="h-4 w-4 shrink-0 mt-0.5" />
                <span>目前使用匿名帳號，清除瀏覽器資料後將遺失所有進度。</span>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleLinkGoogle}
                disabled={isLinking}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLinking ? '處理中…' : '綁定 Google 帳號'}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-muted-foreground"
                onClick={handleSwitchToGoogle}
                disabled={isLinking}
              >
                <RefreshCw className="h-4 w-4" />
                已有舊帳號？切換到 Google 登入
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2">
              <ShieldCheck className="h-5 w-5 text-green-400 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-400">已綁定 Google 帳號</p>
                <p className="text-muted-foreground">{game.googleEmail}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.gdrive.title')}</CardTitle>
          <CardDescription>{t('settings.gdrive.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSignedIn ? (
            <div className="space-y-2">
              <Button onClick={handleSyncToCloud} disabled={isSyncing} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {isSyncing ? t('settings.gdrive.syncing') : t('settings.gdrive.syncNow')}
              </Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline" disabled={isSyncing} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        {t('settings.gdrive.restore')}
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" />
                        {t('settings.gdrive.restoreConfirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.gdrive.restoreConfirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRestoreFromCloud}>
                        {t('settings.gdrive.restoreConfirmAction')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              <Button onClick={signOut} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                {t('settings.gdrive.signOut')}
              </Button>
            </div>
          ) : (
            <Button onClick={handleSignIn} disabled={!gsiLoaded} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              {t('settings.gdrive.signIn')}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language.title')}</CardTitle>
          <CardDescription>{t('settings.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={toggleLanguage} variant="outline" className="w-full">
            <Languages className="mr-2 h-4 w-4" />
            {t('settings.language.toggle')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
