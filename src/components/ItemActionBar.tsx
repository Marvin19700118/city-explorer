'use client';

import * as React from 'react';
import { MapPin, Search, Sparkles, X, Loader2 } from 'lucide-react';
import { generateLocationIntro } from '@/app/actions';
import { useGame } from '@/context/FirebaseGameContext';

type Props = {
  name: string;
  lat: number;
  lng: number;
  searchQuery?: string; // defaults to name
};

export function ItemActionBar({ name, lat, lng, searchQuery }: Props) {
  const [introOpen, setIntroOpen] = React.useState(false);
  const [introText, setIntroText] = React.useState<string | null>(null);
  const [introLoading, setIntroLoading] = React.useState(false);
  const game = useGame();

  const openMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const openSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const q = encodeURIComponent((searchQuery ?? name) + ' 台灣');
    window.open(`https://www.google.com/search?q=${q}`, '_blank');
  };

  const openAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIntroOpen(true);
    if (introText) return; // cached
    setIntroLoading(true);
    try {
      const result = await generateLocationIntro({ locationName: name });
      if (result?.introduction) {
        setIntroText(result.introduction);
        game.incrementGeminiCount();
      } else {
        setIntroText('無法取得介紹，請稍後再試。');
      }
    } catch {
      setIntroText('無法取得介紹，請稍後再試。');
    } finally {
      setIntroLoading(false);
    }
  };

  return (
    <>
      {/* Three action buttons */}
      <div className="flex gap-1 border-t border-border/40 pt-2 mt-1">
        <ActionBtn icon={<MapPin className="h-3.5 w-3.5" />} label="地圖" onClick={openMap} color="blue" />
        <ActionBtn icon={<Search className="h-3.5 w-3.5" />} label="網路搜尋" onClick={openSearch} color="slate" />
        <ActionBtn icon={<Sparkles className="h-3.5 w-3.5" />} label="AI 簡介" onClick={openAI} color="violet" />
      </div>

      {/* AI Intro sheet */}
      {introOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setIntroOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-background rounded-t-2xl p-5 pb-8 shadow-2xl space-y-3 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h3 className="font-bold text-base">{name}</h3>
              </div>
              <button onClick={() => setIntroOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {introLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">AI 正在撰寫介紹…</span>
              </div>
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {introText}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({
  icon, label, onClick, color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  color: 'blue' | 'slate' | 'violet';
}) {
  const colorClass = {
    blue:   'text-blue-500 hover:bg-blue-500/10',
    slate:  'text-slate-500 hover:bg-slate-500/10',
    violet: 'text-violet-500 hover:bg-violet-500/10',
  }[color];

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${colorClass}`}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}
