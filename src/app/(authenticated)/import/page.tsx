'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useProfile } from '@/lib/hooks/use-profile';
import {
  parseStatement,
  importTransactions,
} from '@/app/actions/import-actions';
import { PdfDropZone } from '@/components/import/drop-zone';
import { ParseProgress } from '@/components/import/parse-progress';
import { ReviewScreen } from '@/components/import/review-screen';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { ParseResult } from '@/lib/parser/types';

type ImportPageStatus = 'idle' | 'parsing' | 'review' | 'importing' | 'error';

interface FileQueueItem {
  file: File;
  fileName: string;
}

interface ImportPageState {
  status: ImportPageStatus;
  queue: FileQueueItem[];
  currentIndex: number;
  parseResult: (ParseResult & { duplicateHashes: string[] }) | null;
  error: { code: string; message: string } | null;
}

const initialState: ImportPageState = {
  status: 'idle',
  queue: [],
  currentIndex: 0,
  parseResult: null,
  error: null,
};

function getErrorMessage(code: string): string {
  switch (code) {
    case 'unsupported_format':
      return 'This PDF does not match any configured bank format. Currently, only Citibank SG credit card statements are supported.';
    case 'no_transactions':
      return 'No transactions were found in this PDF. Please check that this is a valid bank statement.';
    case 'parse_failed':
    default:
      return 'This PDF could not be read. The file may be damaged or in an unexpected format.';
  }
}

function ImportPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-[240px] w-full" />
    </div>
  );
}

export default function ImportPage() {
  const { profile, loading } = useProfile();
  const [state, setState] = useState<ImportPageState>(initialState);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const totalFilesRef = useRef(0);

  const isAdmin = profile?.role === 'admin';

  const currentFile = state.queue[state.currentIndex];
  const hasMoreFiles = state.currentIndex < state.queue.length - 1;
  const isMultiFile = state.queue.length > 1;

  const parseFile = useCallback(
    async (queue: FileQueueItem[], index: number) => {
      const item = queue[index];
      if (!item) return;

      const formData = new FormData();
      formData.append('file', item.file);

      const result = await parseStatement(formData);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          status: 'review',
          parseResult: result.data,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          status: 'error',
          parseResult: null,
          error: result.error,
        }));
      }
    },
    [],
  );

  function handleFilesSelected(files: File[]) {
    const sorted = [...files].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const queue: FileQueueItem[] = sorted.map((f) => ({
      file: f,
      fileName: f.name,
    }));

    totalFilesRef.current = queue.length;

    setState({
      status: 'parsing',
      queue,
      currentIndex: 0,
      parseResult: null,
      error: null,
    });
    setCategoryMap({});

    parseFile(queue, 0);
  }

  function advanceToNextFile() {
    if (hasMoreFiles) {
      const nextIndex = state.currentIndex + 1;
      setState((prev) => ({
        ...prev,
        status: 'parsing',
        currentIndex: nextIndex,
        parseResult: null,
        error: null,
      }));
      setCategoryMap({});
      parseFile(state.queue, nextIndex);
    } else {
      // All files processed
      if (totalFilesRef.current > 1) {
        toast.success(`All ${totalFilesRef.current} files processed.`);
      }
      setState(initialState);
      setCategoryMap({});
      totalFilesRef.current = 0;
    }
  }

  async function handleImport() {
    if (!state.parseResult) return;

    const duplicateSet = new Set(state.parseResult.duplicateHashes);
    const nonDuplicateTxns = state.parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash),
    );

    if (nonDuplicateTxns.length === 0) {
      toast.error('All transactions in this statement have already been imported.');
      return;
    }

    setState((prev) => ({ ...prev, status: 'importing' }));

    const result = await importTransactions({
      transactions: nonDuplicateTxns,
      statementPeriodStart: state.parseResult.statementPeriodStart,
      statementPeriodEnd: state.parseResult.statementPeriodEnd,
      fileName: currentFile?.fileName ?? '',
      categoryMap,
    });

    if (result.success) {
      toast.success(
        `${result.transactionCount} transactions imported from ${result.period}.`,
      );
      advanceToNextFile();
    } else {
      toast.error(result.error || 'Import failed. Please try again.');
      setState((prev) => ({ ...prev, status: 'review' }));
    }
  }

  function handleReset() {
    setState(initialState);
    setCategoryMap({});
    totalFilesRef.current = 0;
  }

  function handleSkipFile() {
    advanceToNextFile();
  }

  if (loading) {
    return (
      <div className="pb-20">
        <ImportPageSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Import Statement</h1>
        <Link
          href="/import/history"
          className="text-sm font-medium underline hover:opacity-70 transition-opacity"
        >
          View History
        </Link>
      </div>

      {/* File queue progress indicator */}
      {isMultiFile && state.status !== 'idle' && (
        <div className="mb-4 flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background px-4 py-2">
          <span className="text-sm font-bold">
            File {state.currentIndex + 1} of {state.queue.length}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-border">
            <div
              className="h-full bg-main transition-all duration-300"
              style={{
                width: `${((state.currentIndex + 1) / state.queue.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {state.status === 'idle' && (
        <PdfDropZone
          onFilesSelected={handleFilesSelected}
          isAdmin={isAdmin ?? false}
          disabled={false}
        />
      )}

      {state.status === 'parsing' && currentFile && (
        <ParseProgress
          fileName={currentFile.fileName}
          filePosition={
            isMultiFile
              ? { current: state.currentIndex + 1, total: state.queue.length }
              : undefined
          }
        />
      )}

      {(state.status === 'review' || state.status === 'importing') &&
        state.parseResult &&
        currentFile && (
          <ReviewScreen
            parseResult={state.parseResult}
            duplicateHashes={state.parseResult.duplicateHashes}
            fileName={currentFile.fileName}
            onImport={handleImport}
            onUploadAnother={hasMoreFiles ? handleSkipFile : handleReset}
            isImporting={state.status === 'importing'}
            onCategoryMapChange={setCategoryMap}
            uploadAnotherLabel={hasMoreFiles ? 'Skip file' : undefined}
          />
        )}

      {state.status === 'error' && state.error && (
        <Card className="border-l-4 border-l-[#ef4444]">
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-base font-bold">Could not parse this PDF</h2>
            <p className="text-sm font-medium opacity-60">
              {getErrorMessage(state.error.code)}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="neutral">
                Upload Again
              </Button>
              {hasMoreFiles && (
                <Button onClick={handleSkipFile}>
                  Skip &amp; Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
