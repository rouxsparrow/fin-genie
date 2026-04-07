'use client';

import type { ParseResult } from '@/lib/parser/types';

interface ReviewScreenProps {
  parseResult: ParseResult;
  duplicateHashes: string[];
  fileName: string;
  onImport: () => void;
  onUploadAnother: () => void;
  isImporting: boolean;
}

export function ReviewScreen(_props: ReviewScreenProps) {
  // Stub - will be fully implemented in Task 3
  return null;
}
