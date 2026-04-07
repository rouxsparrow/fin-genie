'use client';

import { useMemo } from 'react';
import { CollapsedDropZone } from '@/components/import/collapsed-drop-zone';
import { StatementSummary } from '@/components/import/statement-summary';
import { DuplicateWarning } from '@/components/import/duplicate-warning';
import { TransactionTable } from '@/components/import/transaction-table';
import { ImportBar } from '@/components/import/import-bar';
import { Badge } from '@/components/ui/badge';
import type { ParseResult } from '@/lib/parser/types';

interface ReviewScreenProps {
  parseResult: ParseResult;
  duplicateHashes: string[];
  fileName: string;
  onImport: () => void;
  onUploadAnother: () => void;
  isImporting: boolean;
}

export function ReviewScreen({
  parseResult,
  duplicateHashes,
  fileName,
  onImport,
  onUploadAnother,
  isImporting,
}: ReviewScreenProps) {
  const duplicateSet = useMemo(
    () => new Set(duplicateHashes),
    [duplicateHashes],
  );

  const { categorizedTxns, uncategorizedTxns, duplicateTxns } = useMemo(() => {
    const categorized = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash) && false, // No categories in Phase 2
    );
    const uncategorized = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash),
    );
    const duplicates = parseResult.transactions.filter((t) =>
      duplicateSet.has(t.hash),
    );

    return {
      categorizedTxns: categorized,
      uncategorizedTxns: uncategorized,
      duplicateTxns: duplicates,
    };
  }, [parseResult.transactions, duplicateSet]);

  const readyCount = categorizedTxns.length + uncategorizedTxns.length;

  const { totalDebits, totalCredits } = useMemo(() => {
    const nonDuplicates = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash),
    );

    let debits = 0;
    let credits = 0;

    for (const t of nonDuplicates) {
      if (t.isDebit) {
        debits += t.amountCents;
      } else {
        credits += t.amountCents;
      }
    }

    return { totalDebits: debits, totalCredits: credits };
  }, [parseResult.transactions, duplicateSet]);

  return (
    <div className="flex flex-col gap-4">
      {/* Collapsed drop zone */}
      <CollapsedDropZone
        fileName={fileName}
        transactionCount={parseResult.transactions.length}
        onUploadAnother={onUploadAnother}
      />

      {/* Statement summary */}
      <StatementSummary
        periodStart={parseResult.statementPeriodStart}
        periodEnd={parseResult.statementPeriodEnd}
        totalTransactions={readyCount}
        totalDebits={totalDebits}
        totalCredits={totalCredits}
      />

      {/* Duplicate warning */}
      {duplicateTxns.length > 0 && (
        <DuplicateWarning duplicateCount={duplicateTxns.length} />
      )}

      {/* Categorized section */}
      <div className="flex items-center gap-4 border-l-4 border-l-[#16a34a] pl-4">
        <h2 className="text-2xl font-bold">Categorized</h2>
        <Badge>{categorizedTxns.length} transactions</Badge>
      </div>
      {categorizedTxns.length === 0 ? (
        <p className="pl-8 text-sm font-medium opacity-40">
          No categorization rules configured yet
        </p>
      ) : (
        <TransactionTable
          transactions={categorizedTxns}
          duplicateHashes={duplicateSet}
          section="categorized"
        />
      )}

      {/* Uncategorized section */}
      <div className="flex items-center gap-4 border-l-4 border-l-[#d97706] pl-4">
        <h2 className="text-2xl font-bold">Uncategorized</h2>
        <Badge variant="neutral">
          {uncategorizedTxns.length} transactions
        </Badge>
      </div>
      {uncategorizedTxns.length > 0 && (
        <TransactionTable
          transactions={uncategorizedTxns}
          duplicateHashes={duplicateSet}
          section="uncategorized"
        />
      )}

      {/* Duplicate section (show in uncategorized table with strikethrough) */}
      {duplicateTxns.length > 0 && (
        <TransactionTable
          transactions={duplicateTxns}
          duplicateHashes={duplicateSet}
          section="uncategorized"
        />
      )}

      {/* Import bar */}
      <ImportBar
        readyCount={readyCount}
        onImport={onImport}
        isImporting={isImporting}
      />
    </div>
  );
}
