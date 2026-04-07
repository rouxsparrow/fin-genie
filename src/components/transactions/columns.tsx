'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { TransactionWithCategory } from '@/app/actions/analytics-actions';

export function formatCurrency(amountCents: number, isDebit: boolean): string {
  const formatted = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amountCents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

export const columns: ColumnDef<TransactionWithCategory>[] = [
  {
    accessorKey: 'transaction_date',
    header: 'Date',
    cell: ({ row }) =>
      format(parseISO(row.original.transaction_date), 'd MMM yyyy'),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="block max-w-[400px] truncate">
        {row.original.description}
      </span>
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const cat = row.original.categories;
      return cat ? (
        <Badge variant={cat.is_system ? 'neutral' : 'default'}>
          {cat.name}
        </Badge>
      ) : (
        <span className="text-sm font-medium opacity-40">--</span>
      );
    },
  },
  {
    accessorKey: 'amount_cents',
    header: 'Amount',
    cell: ({ row }) =>
      formatCurrency(row.original.amount_cents, row.original.is_debit),
  },
];
