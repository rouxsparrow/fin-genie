'use client';

import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ParsedTransaction } from '@/lib/parser/types';

interface TransactionCardProps {
  transaction: ParsedTransaction;
  isDuplicate: boolean;
  category?: string;
}

function formatCurrency(amountCents: number, isDebit: boolean): string {
  const formatted = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amountCents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

export function TransactionCard({
  transaction,
  isDuplicate,
  category,
}: TransactionCardProps) {
  return (
    <Card
      className={cn(isDuplicate && 'opacity-50')}
      aria-disabled={isDuplicate || undefined}
    >
      <CardContent className="p-4">
        <div className={cn('flex flex-col gap-1', isDuplicate && 'line-through')}>
          <div className="flex items-center gap-1.5">
            {isDuplicate && (
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#d97706]" />
            )}
            <p className="text-sm font-bold">{transaction.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-40">
              {format(parseISO(transaction.date), 'd MMM yyyy')}
            </p>
            <p className="text-base font-bold tabular-nums">
              {formatCurrency(transaction.amountCents, transaction.isDebit)}
            </p>
          </div>
          <p className="text-sm font-medium opacity-40">
            {category ?? '--'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
