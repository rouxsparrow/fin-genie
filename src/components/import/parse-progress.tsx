'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ParseProgressProps {
  fileName: string;
}

export function ParseProgress({ fileName }: ParseProgressProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Upload indicator */}
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Uploading {fileName}...</span>
      </div>

      {/* Skeleton mimicking review layout */}
      <Skeleton className="h-[120px] w-full" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
