
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    // Always redirect to the welcome page on start, every time.
    router.replace('/welcome');
  }, [router]);

  // Render a loading state while the redirect is happening.
  return (
     <div className="flex min-h-screen flex-col items-center justify-center bg-black font-body text-foreground">
      <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-primary/50 bg-background shadow-2xl shadow-primary/20">
         <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
             <div className="w-full pt-8 space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
             </div>
         </div>
      </div>
    </div>
  );
}
