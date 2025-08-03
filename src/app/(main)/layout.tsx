
'use client';

import * as React from 'react';
import { Map, Gem, History, Utensils } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LocationTrackingProvider } from '@/context/LocationTrackingContext';

const navItems = [
  { href: '/map', label: '地圖', icon: Map },
  { href: '/food', label: '美食', icon: Utensils },
  { href: '/history', label: '紀錄', icon: History },
  { href: '/achievements', label: '成就', icon: Gem },
];

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <LocationTrackingProvider>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-200 font-body text-foreground">
        <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-gray-300 bg-background shadow-2xl">
            <main className="flex-1 overflow-auto">{children}</main>

            <nav className="h-20 border-t bg-background shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
                <div className="mx-auto grid h-full max-w-md grid-cols-4 items-center justify-items-center px-2">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                            'flex flex-col items-center justify-center gap-1 rounded-full p-2 text-xs font-medium transition-colors w-20 h-10',
                            !isActive && 'text-muted-foreground hover:bg-muted/50'
                            )}
                        >
                          <div className={cn(
                              'flex h-8 w-16 items-center justify-center rounded-full',
                               isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                          )}>
                             <item.icon className="h-6 w-6" />
                          </div>
                           <span className={cn('font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
                        </Link>
                      )
                    })}
                </div>
            </nav>
        </div>
        </div>
    </LocationTrackingProvider>
  );
}
