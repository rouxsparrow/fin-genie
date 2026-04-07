'use client';

import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransactionCard } from '@/components/import/transaction-card';
import { cn } from '@/lib/utils';
import type { ParsedTransaction } from '@/lib/parser/types';

interface TransactionTableProps {
  transactions: ParsedTransaction[];
  duplicateHashes: Set<string>;
  section: 'categorized' | 'uncategorized';
}

function formatCurrency(amountCents: number, isDebit: boolean): string {
  const formatted = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amountCents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

export function TransactionTable({
  transactions,
  duplicateHashes,
  section,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm font-bold">Date</TableHead>
              <TableHead className="text-sm font-bold">Description</TableHead>
              <TableHead className="text-right text-sm font-bold">
                Amount (SGD)
              </TableHead>
              <TableHead className="text-sm font-bold">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => {
              const isDuplicate = duplicateHashes.has(tx.hash);

              return (
                <TableRow
                  key={tx.hash}
                  className={cn(
                    'h-12',
                    index % 2 === 0
                      ? 'bg-secondary-background'
                      : 'bg-background',
                    isDuplicate &&
                      'opacity-50 hover:bg-transparent',
                  )}
                  aria-disabled={isDuplicate || undefined}
                >
                  <TableCell
                    className={cn(
                      'text-sm font-medium',
                      isDuplicate && 'line-through',
                    )}
                  >
                    {format(parseISO(tx.date), 'd MMM yyyy')}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'max-w-[300px] truncate text-sm font-medium',
                      isDuplicate && 'line-through',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {isDuplicate && (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[#d97706]" />
                      )}
                      {tx.description}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-sm font-medium tabular-nums',
                      isDuplicate && 'line-through',
                    )}
                  >
                    {formatCurrency(tx.amountCents, tx.isDebit)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-sm font-medium',
                      isDuplicate && 'line-through',
                    )}
                  >
                    {section === 'categorized' ? (
                      <span className="text-sm font-medium opacity-40">
                        --
                      </span>
                    ) : (
                      <span className="text-sm font-medium opacity-40">
                        --
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {transactions.map((tx) => {
          const isDuplicate = duplicateHashes.has(tx.hash);

          return (
            <TransactionCard
              key={tx.hash}
              transaction={tx}
              isDuplicate={isDuplicate}
              category={
                section === 'categorized' ? undefined : undefined
              }
            />
          );
        })}
      </div>
    </>
  );
}
