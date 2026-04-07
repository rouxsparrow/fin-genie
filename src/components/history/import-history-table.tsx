'use client';

import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface ImportHistoryTableProps {
  imports: Array<{
    id: string;
    file_name: string;
    statement_period_start: string | null;
    statement_period_end: string | null;
    transaction_count: number;
    created_at: string;
    profiles?: { full_name: string } | null;
  }>;
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return '--';
  return `${format(parseISO(start), 'd MMM yyyy')} - ${format(parseISO(end), 'd MMM yyyy')}`;
}

function formatImportDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy, h:mm a');
}

export function ImportHistoryTable({ imports }: ImportHistoryTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-sm">File Name</TableHead>
              <TableHead className="font-bold text-sm">
                Statement Period
              </TableHead>
              <TableHead className="font-bold text-sm text-right">
                Transactions
              </TableHead>
              <TableHead className="font-bold text-sm">Imported By</TableHead>
              <TableHead className="font-bold text-sm">
                Date Imported
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.map((imp, index) => (
              <TableRow
                key={imp.id}
                className={
                  index % 2 === 0
                    ? 'bg-secondary-background'
                    : 'even:bg-background'
                }
              >
                <TableCell className="font-bold text-sm">
                  {imp.file_name}
                </TableCell>
                <TableCell className="text-sm">
                  {formatPeriod(
                    imp.statement_period_start,
                    imp.statement_period_end,
                  )}
                </TableCell>
                <TableCell className="text-sm text-right">
                  {imp.transaction_count}
                </TableCell>
                <TableCell className="text-sm">
                  {imp.profiles?.full_name ?? '--'}
                </TableCell>
                <TableCell className="text-sm">
                  {formatImportDate(imp.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden flex flex-col gap-3">
        {imports.map((imp) => (
          <Card key={imp.id}>
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-sm font-bold">{imp.file_name}</p>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-sm opacity-40">Period</span>
                  <span className="text-sm">
                    {formatPeriod(
                      imp.statement_period_start,
                      imp.statement_period_end,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-40">Transactions</span>
                  <span className="text-sm">{imp.transaction_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-40">Imported by</span>
                  <span className="text-sm">
                    {imp.profiles?.full_name ?? '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-40">Date</span>
                  <span className="text-sm">
                    {formatImportDate(imp.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
