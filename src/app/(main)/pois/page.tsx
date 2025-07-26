
'use client';

// This is a placeholder page and is not meant to be navigated to directly.
// It exists to prevent routing errors from previous misconfigurations.
import { Compass } from 'lucide-react';
import * as React from 'react';

export default function PoisPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <Compass className="w-16 h-16 mx-auto text-accent" />
        <h3 className="text-2xl font-bold mt-4">頁面不存在</h3>
        <p className="text-muted-foreground mt-2">
          您似乎訪問了一個不存在的頁面。
        </p>
      </div>
    </div>
  );
}
