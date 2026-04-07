'use client';

import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/components/transactions/columns';
import type { TransactionWithCategory } from '@/app/actions/analytics-actions';

interface TransactionListCardProps {
  transaction: TransactionWithCategory;
}

export function TransactionListCard({ transaction }: TransactionListCardProps) {
  const cat = transaction.categories;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          {/* Line 1: Description */}
          <p className="text-sm font-bold">{transaction.description}</p>

          {/* Line 2: Date + Amount */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-40">
              {format(parseISO(transaction.transaction_date), 'd MMM yyyy')}
            </p>
            <p className="text-base font-bold tabular-nums">
              {formatCurrency(transaction.amount_cents, transaction.is_debit)}
            </p>
          </div>

          {/* Line 3: Category badge */}
          <div>
            {cat ? (
              <Badge variant={cat.is_system ? 'neutral' : 'default'}>
                {cat.name}
              </Badge>
            ) : (
              <span className="text-sm font-medium opacity-40">--</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
