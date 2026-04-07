'use client';

import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

interface StatementSummaryProps {
  periodStart: string;
  periodEnd: string;
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
}

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amountCents / 100);
}

export function StatementSummary({
  periodStart,
  periodEnd,
  totalTransactions,
  totalDebits,
  totalCredits,
}: StatementSummaryProps) {
  const formattedStart = format(parseISO(periodStart), 'd MMM yyyy');
  const formattedEnd = format(parseISO(periodEnd), 'd MMM yyyy');

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium opacity-60">Statement Period</p>
            <p className="text-base font-medium">
              {formattedStart} &ndash; {formattedEnd}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium opacity-60">
              Total Transactions
            </p>
            <p className="text-base font-bold">{totalTransactions}</p>
          </div>
          <div>
            <p className="text-sm font-medium opacity-60">Total Debits</p>
            <p className="text-base font-bold">{formatCurrency(totalDebits)}</p>
          </div>
          <div>
            <p className="text-sm font-medium opacity-60">Total Credits</p>
            <p className="text-base font-bold">
              ({formatCurrency(totalCredits)})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
