'use client';

import { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ParsedTransaction } from '@/lib/parser/types';

interface TransactionCardProps {
  transaction: ParsedTransaction;
  isDuplicate: boolean;
  categoryName?: string;
  isSystemCategory?: boolean;
  isUncategorized?: boolean;
  onTap?: () => void;
}

function formatCurrency(amountCents: number, isDebit: boolean): string {
  const formatted = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amountCents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

export const TransactionCard = forwardRef<HTMLDivElement, TransactionCardProps & React.HTMLAttributes<HTMLDivElement>>(
  function TransactionCard({
    transaction,
    isDuplicate,
    categoryName,
    isSystemCategory,
    isUncategorized,
    onTap,
    ...rest
  }, ref) {
  return (
    <Card
      ref={ref}
      {...rest}
      className={cn(
        isDuplicate && 'opacity-50',
        isUncategorized && 'cursor-pointer',
      )}
      aria-disabled={isDuplicate || undefined}
      onClick={isUncategorized && onTap ? onTap : undefined}
      role={isUncategorized ? 'button' : undefined}
      tabIndex={isUncategorized ? 0 : undefined}
      onKeyDown={
        isUncategorized && onTap
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTap();
              }
            }
          : undefined
      }
    >
      <CardContent className="p-4">
        <div
          className={cn(
            'flex flex-col gap-1',
            isDuplicate && 'line-through',
          )}
        >
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
          <div>
            {categoryName ? (
              <Badge variant={isSystemCategory ? 'neutral' : 'default'}>
                {isSystemCategory && <Lock className="h-3 w-3" />}
                {categoryName}
              </Badge>
            ) : (
              <span className="text-sm font-medium opacity-40">--</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
