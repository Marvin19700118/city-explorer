'use client';

import * as React from 'react';
import { MapPin, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseConfigured } from '@/lib/firebase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    if (!firebaseConfigured) return;
    try {
      const user = await signInWithGoogle();
      if (user) {
        router.push('/map');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Optionally, show a toast notification for login failure
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background font-body text-foreground">
      <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col justify-between overflow-hidden rounded-2xl border-4 border-primary/50 bg-background p-8 text-center shadow-2xl shadow-primary/20">
        <div className="flex flex-col items-center justify-center gap-2 font-headline text-3xl font-bold text-primary">
          <MapPin className="h-10 w-10" />
          <h1>城市探險家</h1>
          <p className="mt-2 text-base font-body font-normal text-muted-foreground">
            一步一腳印，探索您的世界。
          </p>
        </div>
        
        <div className="flex-grow flex items-center justify-center">
            <Mountain className="w-48 h-48 text-primary/20"/>
        </div>

        <div className="flex flex-col gap-4">
            {!firebaseConfigured && (
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Firebase 未設定</AlertTitle>
                    <AlertDescription>
                        請在 .env 檔案中加入您的 Firebase 設定以啟用登入功能。
                    </AlertDescription>
                </Alert>
            )}
            <p className="text-sm text-muted-foreground">
                登入以開始您的冒險。
            </p>
          <Button onClick={handleLogin} size="lg" className="w-full font-bold" disabled={!firebaseConfigured}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-68.6 68.6c-20.5-18.9-46-30.8-72.3-30.8-58.8 0-106.3 47.9-106.3 106.3s47.5 106.3 106.3 106.3c35.6 0 66.2-17.4 86.4-44.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            使用 Google 登入
          </Button>
        </div>
      </div>
    </div>
  );
}
