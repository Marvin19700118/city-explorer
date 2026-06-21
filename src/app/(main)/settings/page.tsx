
'use client';

import * as React from 'react';
import { Settings as SettingsIcon, Languages, BrainCircuit, Map, RotateCcw, ShieldCheck, UserX, RefreshCw, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nContext';
import { useGame } from '@/context/FirebaseGameContext';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithRedirect, linkWithRedirect } from 'firebase/auth';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = React.useState(false);
  const [goalInput, setGoalInput] = React.useState('');
  const [goalEditing, setGoalEditing] = React.useState(false);
  const { i18n, setLocale, t } = useI18n();
  const game = useGame();

  const isMobile = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const REDIRECT_KEY = 'ts_google_redirect';

  const handleLinkGoogle = () => {
    if (isMobile()) {
      // iOS: must call signInWithRedirect synchronously from the click handler
      // Any async intermediary breaks the user gesture chain and blocks navigation
      if (!auth.currentUser) return;
      sessionStorage.setItem(REDIRECT_KEY, '1');
      linkWithRedirect(auth.currentUser, new GoogleAuthProvider());
    } else {
      setIsLinking(true);
      game.linkWithGoogle()
        .then(() => toast({ title: '已綁定 Google 帳號', description: '您的資料現在已與 Google 帳號連結，換裝置也不會遺失。' }))
        .catch((e: any) => {
          if (e.code === 'auth/credential-already-in-use') {
            toast({ title: '此 Google 帳號已被使用', description: '請試試「切換到已有 Google 帳號」。', variant: 'destructive' });
          } else {
            toast({ title: '綁定失敗', description: e.message, variant: 'destructive' });
          }
        })
        .finally(() => setIsLinking(false));
    }
  };

  const handleSwitchToGoogle = () => {
    if (!confirm('切換後會使用 Google 帳號的資料，目前的匿名資料將不再顯示。確定繼續？')) return;
    if (isMobile()) {
      // iOS: fully synchronous — no await anywhere before signInWithRedirect
      sessionStorage.setItem(REDIRECT_KEY, '1');
      signInWithRedirect(auth, new GoogleAuthProvider());
    } else {
      setIsLinking(true);
      game.switchToGoogleAccount()
        .catch((e: any) => toast({ title: '切換失敗', description: e.message, variant: 'destructive' }))
        .finally(() => setIsLinking(false));
    }
  };

  const handleResetCounters = async () => {
    await game.resetApiCounts();
    toast({ title: "計數器已重設", description: "API 呼叫次數已歸零。" });
  };

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

      {/* 每日目標 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            每日步行目標
          </CardTitle>
          <CardDescription>設定每天想走的距離目標，顯示在地圖頁頂部進度條。</CardDescription>
        </CardHeader>
        <CardContent>
          {goalEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">km</span>
              <Button size="sm" onClick={async () => {
                const val = parseFloat(goalInput);
                if (isNaN(val) || val < 0.5 || val > 50) {
                  toast({ title: '請輸入 0.5 ~ 50 之間的數字', variant: 'destructive' });
                  return;
                }
                await game.updateDailyGoal(val);
                setGoalEditing(false);
                toast({ title: `每日目標已設為 ${val} km` });
              }}>儲存</Button>
              <Button size="sm" variant="ghost" onClick={() => setGoalEditing(false)}>取消</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-accent">{game.dailyStats?.goalKm ?? 5} km</span>
              <Button variant="outline" size="sm" onClick={() => {
                setGoalInput(String(game.dailyStats?.goalKm ?? 5));
                setGoalEditing(true);
              }}>修改</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API 使用統計 */}
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

      {/* 帳號安全 */}
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
              <Button className="w-full gap-2" onClick={handleLinkGoogle} disabled={isLinking}>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLinking ? '處理中…' : '綁定 Google 帳號'}
              </Button>
              <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={handleSwitchToGoogle} disabled={isLinking}>
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

      {/* 語言 */}
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
