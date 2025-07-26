'use client';

import * as React from 'react';
import { Map, Gem, Settings, History, Building } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/map', label: '地圖', icon: Map },
  { href: '/pois', label: '景點', icon: Building },
  { href: '/history', label: '紀錄', icon: History },
  { href: '/achievements', label: '成就', icon: Gem },
  { href: '/settings', label: '設定', icon: Settings },
];

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-body text-foreground">
      <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-primary/50 bg-background shadow-2xl shadow-primary/20">
        <main className="flex-1 overflow-auto">{children}</main>

        <nav className="border-t-2 border-primary/20 bg-background">
          <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-items-center px-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md p-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
