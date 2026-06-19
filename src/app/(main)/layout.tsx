
'use client';

import * as React from 'react';
import { Map, Gem, History, Utensils, Settings, Landmark, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LocationTrackingProvider } from '@/context/LocationTrackingContext';
import { I18nProvider, useI18n } from '@/context/I18nContext';
import { AuthProvider } from '@/context/AuthContext';

const NavItemsWrapper = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems = [
    { href: '/map', label: t('nav.map'), icon: Map },
    { href: '/pois', label: t('nav.pois'), icon: MapPin },
    { href: '/attractions', label: t('nav.attractions'), icon: Landmark },
    { href: '/food', label: t('nav.food'), icon: Utensils },
    { href: '/history', label: t('nav.history'), icon: History },
    { href: '/achievements', label: t('nav.achievements'), icon: Gem },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-gray-300 bg-background shadow-2xl">
      <main className="flex-1 overflow-auto">{children}</main>

      <nav className="h-20 border-t bg-background/80 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] backdrop-blur-sm">
        <div className="mx-auto grid h-full max-w-md grid-cols-7 items-center justify-items-center px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-full p-1 text-xs font-medium transition-colors w-11 h-14',
                  !isActive && 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <div className={cn(
                    'flex h-7 w-9 items-center justify-center rounded-full',
                     isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                )}>
                   <item.icon className="h-5 w-5" />
                </div>
                 <span className={cn('font-semibold text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <I18nProvider>
      <LocationTrackingProvider>
          <div className="flex min-h-screen flex-col items-center justify-center bg-gray-200 font-body text-foreground">
            <AuthProvider>
                <NavItemsWrapper>{children}</NavItemsWrapper>
            </AuthProvider>
          </div>
      </LocationTrackingProvider>
    </I18nProvider>
  );
}
