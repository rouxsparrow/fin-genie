"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Receipt } from "lucide-react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useProfile } from "@/lib/hooks/use-profile";
import { DateRangeSelector } from "@/components/dashboard/date-range-selector";
import { TransactionDataTable } from "@/components/transactions/transaction-data-table";
import { TransactionSearchBar } from "@/components/transactions/transaction-search-bar";
import { TransactionPagination } from "@/components/transactions/transaction-pagination";
import { TransactionListCard } from "@/components/transactions/transaction-list-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchTransactionList,
  type TransactionWithCategory,
} from "@/app/actions/analytics-actions";
import { fetchCategories } from "@/app/actions/category-actions";
import type { Category } from "@/lib/types/database";

const PAGE_SIZE = 25;

function formatTotalCurrency(amountCents: number): string {
  const formatted = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(Math.abs(amountCents) / 100);

  return amountCents < 0 ? `(${formatted})` : formatted;
}

function TransactionsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 md:p-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsLoadingSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const { from, to } = useDateRange();
  const { profile } = useProfile();
  const isAdmin = profile?.role === "admin";

  // URL state via nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault(""),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("transaction_date"),
  );
  const [dir, setDir] = useQueryState("dir", parseAsString.withDefault("desc"));

  // Data state
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, sort, dir]);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      const result = await fetchCategories();
      if (result.success) {
        setCategories(result.categories);
      }
    }
    loadCategories();
  }, []);

  // Fetch transactions
  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setLoading(true);
      setError(null);

      const result = await fetchTransactionList({
        from,
        to,
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: category || undefined,
        sortBy: sort || "transaction_date",
        sortDir: (dir as "asc" | "desc") || "desc",
      });

      if (cancelled) return;

      if (result.success) {
        setTransactions(result.data.transactions);
        setTotal(result.data.total);
        setTotalAmount(result.data.totalAmount);
        setTotalPages(result.data.totalPages);
      } else {
        setError(result.error);
      }

      setLoading(false);
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [from, to, page, debouncedSearch, category, sort, dir]);

  // Sort handler
  const handleSort = useCallback(
    (columnId: string) => {
      if (sort === columnId) {
        setDir(dir === "asc" ? "desc" : "asc");
      } else {
        setSort(columnId);
        setDir("asc");
      }
    },
    [sort, dir, setSort, setDir],
  );

  // Page change handler
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  // Search change handler
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value || null);
    },
    [setSearch],
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setCategory(categoryId || null);
    },
    [setCategory],
  );

  // Determine empty state type
  const hasFiltersActive = !!(debouncedSearch || category);
  const isNoTransactionsAtAll = total === 0 && !hasFiltersActive && !loading;
  const isNoSearchResults = total === 0 && !!debouncedSearch && !loading;
  const isNoDateRangeResults =
    total === 0 && !hasFiltersActive && !loading && !isNoTransactionsAtAll;

  return (
    <div className="flex flex-col gap-4 p-6 md:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <DateRangeSelector />
      </div>

      {/* Search and filter bar */}
      <TransactionSearchBar
        search={search}
        categoryId={category}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
      />

      {!loading && total > 0 && (
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-sm font-bold opacity-60">Total Amount</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatTotalCurrency(totalAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Screen reader results count */}
      <div aria-live="polite" className="sr-only">
        {!loading && `${total} transactions found`}
      </div>

      {/* Error state */}
      {error && (
        <p className="text-center text-base font-medium text-red-600">
          Could not load spending data. Please try refreshing.
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-1">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
          <div className="flex justify-end mt-2">
            <Skeleton className="h-9 w-[120px]" />
          </div>
        </div>
      )}

      {/* Empty: no transactions at all */}
      {!loading && isNoTransactionsAtAll && (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          heading="No transactions yet"
          body={
            isAdmin
              ? "Import a bank statement to see your transactions here."
              : "No transactions have been imported yet."
          }
          ctaLabel={isAdmin ? "Import Statement" : undefined}
          ctaHref={isAdmin ? "/import" : undefined}
        />
      )}

      {/* Empty: no search results */}
      {!loading && !isNoTransactionsAtAll && isNoSearchResults && (
        <p className="text-center text-base font-medium opacity-60 py-12">
          No transactions match your search.
        </p>
      )}

      {/* Empty: no date range results */}
      {!loading && isNoDateRangeResults && (
        <p className="text-center text-base font-medium opacity-60 py-12">
          No transactions in this date range.
        </p>
      )}

      {/* Data table (desktop) */}
      {!loading && total > 0 && (
        <>
          <div className="hidden md:block">
            <TransactionDataTable
              data={transactions}
              sortBy={sort}
              sortDir={dir as "asc" | "desc"}
              onSort={handleSort}
            />
          </div>

          {/* Card layout (mobile) */}
          <div className="flex flex-col gap-2 md:hidden">
            {transactions.map((tx) => (
              <TransactionListCard key={tx.id} transaction={tx} />
            ))}
          </div>

          {/* Pagination */}
          <TransactionPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
