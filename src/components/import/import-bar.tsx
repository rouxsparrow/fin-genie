'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportBarProps {
  categorizedCount: number;
  totalCount: number;
  allCategorized: boolean;
  onImport: () => void;
  isImporting: boolean;
}

export function ImportBar({
  categorizedCount,
  totalCount,
  allCategorized,
  onImport,
  isImporting,
}: ImportBarProps) {
  const percentage =
    totalCount > 0 ? Math.round((categorizedCount / totalCount) * 100) : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t-2 border-border bg-background px-6 shadow-[0_-4px_0_0_var(--border)] md:left-[var(--sidebar-width,256px)]"
      aria-live="polite"
    >
      <div className="flex h-12 items-center justify-between">
        <p className="text-base font-medium">
          {allCategorized ? (
            <span className="font-bold">
              {totalCount} transactions ready
            </span>
          ) : (
            <>
              {categorizedCount}/{totalCount} categorized &mdash; categorize
              all to import
            </>
          )}
        </p>
        <div className="relative">
          <Button
            onClick={onImport}
            disabled={!allCategorized || totalCount === 0 || isImporting}
            className={
              !allCategorized
                ? 'cursor-not-allowed opacity-50 shadow-none'
                : ''
            }
            aria-describedby={
              !allCategorized ? 'import-disabled-reason' : undefined
            }
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : allCategorized ? (
              `Import ${totalCount} Transactions`
            ) : (
              'Import Transactions'
            )}
          </Button>
          {!allCategorized && (
            <span id="import-disabled-reason" className="sr-only">
              Categorize all transactions to enable import
            </span>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mb-2 h-[4px] w-full overflow-hidden rounded-base border-2 border-border">
        <div
          className="h-full bg-main transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
