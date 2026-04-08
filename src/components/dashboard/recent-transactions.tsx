'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TransactionWithCategory } from '@/app/actions/analytics-actions';

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
  total: number;
  dateFrom: string;
  dateTo: string;
  categoryId?: string | null;
}

function formatCurrency(cents: number, isDebit: boolean): string {
  const formatted = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(cents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

export function RecentTransactions({
  transactions,
  total,
  dateFrom,
  dateTo,
  categoryId,
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return null;
  }

  // Build View All href with preserved URL params
  let viewAllHref = `/transactions?from=${dateFrom}&to=${dateTo}`;
  if (categoryId) {
    viewAllHref += `&category=${categoryId}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Recent Transactions</CardTitle>
        <CardAction>
          <Link
            href={viewAllHref}
            className="text-sm font-medium hover:underline hover:decoration-main transition-colors"
          >
            View All
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm font-bold">Date</TableHead>
                <TableHead className="text-sm font-bold">Description</TableHead>
                <TableHead className="text-sm font-bold">Category</TableHead>
                <TableHead className="text-sm font-bold text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, index) => (
                <TableRow
                  key={tx.id}
                  className={
                    index % 2 === 0
                      ? 'bg-secondary-background'
                      : 'bg-background'
                  }
                >
                  <TableCell className="text-sm font-medium h-12 py-0">
                    {format(parseISO(tx.transaction_date), 'd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-sm font-medium h-12 py-0 max-w-[400px] truncate">
                    {tx.description}
                  </TableCell>
                  <TableCell className="h-12 py-0">
                    {tx.categories ? (
                      <Badge
                        variant={
                          tx.categories.is_system ? 'neutral' : 'default'
                        }
                      >
                        {tx.categories.name}
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium opacity-40">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-right tabular-nums h-12 py-0">
                    {formatCurrency(tx.amount_cents, tx.is_debit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile stacked cards */}
        <div className="flex flex-col gap-2 md:hidden">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="border-2 border-border rounded-base p-4"
            >
              <p className="text-sm font-bold truncate">{tx.description}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-medium opacity-40">
                  {format(parseISO(tx.transaction_date), 'd MMM yyyy')}
                </p>
                <p className="text-base font-bold tabular-nums">
                  {formatCurrency(tx.amount_cents, tx.is_debit)}
                </p>
              </div>
              <div className="mt-1">
                {tx.categories ? (
                  <Badge
                    variant={tx.categories.is_system ? 'neutral' : 'default'}
                  >
                    {tx.categories.name}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium opacity-40">--</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Showing count */}
        {total > 10 && (
          <p className="text-sm font-medium opacity-40 mt-4">
            Showing 10 of {total}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
