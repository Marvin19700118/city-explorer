
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

            <nav className="absolute bottom-0 left-0 right-0 h-24 bg-background/80 pb-4 backdrop-blur-lg">
                <div className="mx-auto grid h-full max-w-md grid-cols-4 items-center justify-items-center px-4 pt-2">
                    {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                        'flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors w-16 h-14',
                        pathname === item.href
                            ? 'text-primary'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                    >
                        <div className={cn("p-2 rounded-full", pathname === item.href ? 'bg-primary/10' : '')}>
                         <item.icon className="h-6 w-6" />
                        </div>
                        <span className={cn(pathname === item.href ? 'font-semibold' : '')}>{item.label}</span>
                    </Link>
                    ))}
                </div>
            </nav>
        </div>
        </div>
    </LocationTrackingProvider>
  );
}
