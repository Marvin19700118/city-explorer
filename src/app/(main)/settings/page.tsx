
'use client';

import * as React from 'react';
import { Settings as SettingsIcon, Languages, LogIn, LogOut, Download, Upload, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nContext';
import type { GameSaveData } from '@/lib/types';
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
  const { i18n, setLocale, t } = useI18n();

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
        throw new Error('Failed to search for file in Google Drive.');
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
            pois: JSON.parse(localStorage.getItem('pois') || '[]'),
            trips: JSON.parse(localStorage.getItem('trips') || '[]'),
            cityPoints: JSON.parse(localStorage.getItem('cityPoints') || '{}'),
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            lastUpdated: new Date().toISOString(),
        };

        const fileId = await getFileId(accessToken);
        const metadata = { name: GDRIVE_FILE_NAME, mimeType: 'application/json' };
        if (!fileId) {
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
            return;
        }

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
             throw new Error("Failed to download file from Google Drive.");
        }

        const saveData: GameSaveData = await response.json();
        
        localStorage.setItem('pois', JSON.stringify(saveData.pois || []));
        localStorage.setItem('trips', JSON.stringify(saveData.trips || []));
        localStorage.setItem('cityPoints', JSON.stringify(saveData.cityPoints || {}));
        localStorage.setItem('settings', JSON.stringify(saveData.settings || {}));

        toast({ title: t('settings.gdrive.restoreSuccessTitle'), description: `${t('settings.gdrive.restoreSuccessDescription')} ${new Date(saveData.lastUpdated).toLocaleString()}` });

        // Trigger a storage event to notify other tabs/components to update their state
        window.dispatchEvent(new StorageEvent('storage', { key: 'cityPoints', newValue: localStorage.getItem('cityPoints') }));

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

