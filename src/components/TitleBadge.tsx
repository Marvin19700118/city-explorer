
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { TitleIcon } from '@/components/icons';
import type { Title } from '@/lib/types';
import { cn } from '@/lib/utils';

type TitleBadgeProps = {
  title: Title['name'];
  className?: string;
};

const titleStyles: { [key in Title['name']]: string } = {
    '新手探險家': 'bg-slate-200 text-slate-700 border-slate-300',
    '城市漫遊者': 'bg-sky-200 text-sky-800 border-sky-300',
    '區域專家': 'bg-emerald-200 text-emerald-800 border-emerald-300',
    '專業導遊': 'bg-amber-200 text-amber-800 border-amber-300',
    '金牌專業導覽員': 'bg-yellow-300 text-yellow-900 border-yellow-400 font-bold shadow-md shadow-yellow-500/20',
};


export const TitleBadge = ({ title, className }: TitleBadgeProps) => {
  const style = titleStyles[title] || titleStyles['新手探險家'];

  return (
    <Badge className={cn("gap-2", style, className)}>
      <TitleIcon title={title} className="w-4 h-4" />
      {title}
    </Badge>
  );
};
