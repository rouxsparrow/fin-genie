'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportBarProps {
  readyCount: number;
  onImport: () => void;
  isImporting: boolean;
}

export function ImportBar({ readyCount, onImport, isImporting }: ImportBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-t-2 border-border bg-background px-6 shadow-[0_-4px_0_0_var(--border)] md:left-[var(--sidebar-width,256px)]"
      aria-live="polite"
    >
      <p className="text-base font-bold">
        {readyCount} transactions ready
      </p>
      <Button
        onClick={onImport}
        disabled={readyCount === 0 || isImporting}
      >
        {isImporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          `Import ${readyCount} Transactions`
        )}
      </Button>
    </div>
  );
}
