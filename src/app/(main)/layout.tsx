'use client';

import * as React from 'react';
import { Map, BarChart2, Gem, Settings, User, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/firebase/auth';
import { firebaseConfigured } from '@/lib/firebase/client';
import { Trophy } from 'lucide-react';

const navItems = [
  { href: '/map', label: '地圖', icon: Map },
  { href: '/stats', label: '統計', icon: BarChart2 },
  { href: '/history', label: '歷史', icon: History },
  { href: '/achievements', label: '成就', icon: Gem },
  { href: '/settings', label: '設定', icon: Settings },
];

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user && firebaseConfigured) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }
  
  if (!user && firebaseConfigured) {
    return null; // or a redirect component
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-body text-foreground">
      <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-primary/50 bg-background shadow-2xl shadow-primary/20">
        <header className="absolute right-2 top-2 z-20 flex items-center gap-2">
          {firebaseConfigured && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-background/50 backdrop-blur-sm">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
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
