"use client";

import { Receipt } from "lucide-react";
import type { TransactionWithCategory } from "@/app/actions/analytics-actions";
import { CategoryFilterBadge } from "@/components/dashboard/category-filter-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionDataTable } from "@/components/transactions/transaction-data-table";
import { TransactionListCard } from "@/components/transactions/transaction-list-card";
import { TransactionPagination } from "@/components/transactions/transaction-pagination";
import { TransactionSearchBar } from "@/components/transactions/transaction-search-bar";

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  loading: boolean;
  categoryName?: string | null;
  onSearchChange: (value: string) => void;
  onSort: (columnId: string) => void;
  onPageChange: (page: number) => void;
  onClearFilter: () => void;
}

export function RecentTransactions({
  transactions,
  total,
  page,
  totalPages,
  pageSize,
  search,
  sortBy,
  sortDir,
  loading,
  categoryName,
  onSearchChange,
  onSort,
  onPageChange,
  onClearFilter,
}: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle className="text-2xl">Transactions</CardTitle>
        <div className="flex flex-col gap-3">
          <TransactionSearchBar
            search={search}
            onSearchChange={onSearchChange}
          />
          {categoryName && (
            <div className="flex items-center gap-2">
              <CategoryFilterBadge
                categoryName={categoryName}
                onClear={onClearFilter}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div aria-live="polite" className="sr-only">
          {!loading && `${total} transactions found`}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <Receipt className="h-10 w-10 opacity-40" />
            <p className="text-base font-medium opacity-60">
              No transactions match this view.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <TransactionDataTable
                data={transactions}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {transactions.map((transaction) => (
                <TransactionListCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>

            <TransactionPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
