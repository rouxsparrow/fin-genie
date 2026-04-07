'use client';

import { useState } from 'react';
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
import type { ParseResult } from '@/lib/parser/types';

type ImportPageStatus = 'idle' | 'parsing' | 'review' | 'importing' | 'error';

interface ImportPageState {
  status: ImportPageStatus;
  file: File | null;
  parseResult: (ParseResult & { duplicateHashes: string[] }) | null;
  fileName: string;
  error: { code: string; message: string } | null;
}

const initialState: ImportPageState = {
  status: 'idle',
  file: null,
  parseResult: null,
  fileName: '',
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

  const isAdmin = profile?.role === 'admin';

  async function handleFileSelected(file: File) {
    setState({
      status: 'parsing',
      file,
      parseResult: null,
      fileName: file.name,
      error: null,
    });

    const formData = new FormData();
    formData.append('file', file);

    const result = await parseStatement(formData);

    if (result.success) {
      setState({
        status: 'review',
        file,
        parseResult: result.data,
        fileName: result.fileName,
        error: null,
      });
    } else {
      setState({
        status: 'error',
        file: null,
        parseResult: null,
        fileName: file.name,
        error: result.error,
      });
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
      fileName: state.fileName,
      categoryMap,
    });

    if (result.success) {
      toast.success(
        `${result.transactionCount} transactions imported from ${result.period}.`,
      );
      setState(initialState);
      setCategoryMap({});
    } else {
      toast.error('Import failed. Please try again.');
      setState((prev) => ({ ...prev, status: 'review' }));
    }
  }

  function handleReset() {
    setState(initialState);
    setCategoryMap({});
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
      <h1 className="mb-8 text-2xl font-bold">Import Statement</h1>

      {state.status === 'idle' && (
        <PdfDropZone
          onFileSelected={handleFileSelected}
          isAdmin={isAdmin ?? false}
          disabled={false}
        />
      )}

      {state.status === 'parsing' && (
        <ParseProgress fileName={state.fileName} />
      )}

      {(state.status === 'review' || state.status === 'importing') &&
        state.parseResult && (
          <ReviewScreen
            parseResult={state.parseResult}
            duplicateHashes={state.parseResult.duplicateHashes}
            fileName={state.fileName}
            onImport={handleImport}
            onUploadAnother={handleReset}
            isImporting={state.status === 'importing'}
            onCategoryMapChange={setCategoryMap}
          />
        )}

      {state.status === 'error' && state.error && (
        <Card className="border-l-4 border-l-[#ef4444]">
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-base font-bold">Could not parse this PDF</h2>
            <p className="text-sm font-medium opacity-60">
              {getErrorMessage(state.error.code)}
            </p>
            <Button onClick={handleReset} className="w-fit">
              Upload Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
