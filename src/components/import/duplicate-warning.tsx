'use client';

import { AlertTriangle } from 'lucide-react';

interface DuplicateWarningProps {
  duplicateCount: number;
}

export function DuplicateWarning({ duplicateCount }: DuplicateWarningProps) {
  if (duplicateCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-base border-2 border-border border-l-4 border-l-[#d97706] bg-secondary-background p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-[#d97706]" />
      <p className="text-sm font-medium">
        {duplicateCount} transactions already imported and will be skipped.
      </p>
    </div>
  );
}
