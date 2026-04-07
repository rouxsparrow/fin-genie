'use client';

import { FileText } from 'lucide-react';

interface CollapsedDropZoneProps {
  fileName: string;
  transactionCount: number;
  onUploadAnother: () => void;
}

export function CollapsedDropZone({
  fileName,
  transactionCount,
  onUploadAnother,
}: CollapsedDropZoneProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-base border-2 border-border bg-secondary-background p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 shrink-0" />
        <span className="text-sm font-bold">{fileName}</span>
        <span className="text-sm font-medium">
          &mdash; {transactionCount} transactions parsed
        </span>
      </div>
      <button
        onClick={onUploadAnother}
        className="text-sm font-medium text-main underline-offset-4 hover:underline"
      >
        Upload another
      </button>
    </div>
  );
}
