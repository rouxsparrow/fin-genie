'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface TransactionPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function TransactionPagination({
  page,
  totalPages,
  total,
  pageSize,
  loading = false,
  onPageChange,
}: TransactionPaginationProps) {
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  useEffect(() => {
    if (!loading) {
      setPendingPage(null);
    }
  }, [loading]);

  return (
    <div className="flex items-center justify-between w-full">
      {/* Showing count -- hidden on mobile */}
      <p className="hidden md:block text-sm font-medium opacity-40">
        Showing {start}-{end} of {total}
      </p>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <div aria-live="polite" className="sr-only">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="neutral"
          size="sm"
          onClick={() => {
            setPendingPage(page - 1);
            onPageChange(page - 1);
          }}
          disabled={loading || isFirstPage}
          loading={loading && pendingPage === page - 1}
          loadingText="Previous"
          aria-disabled={isFirstPage}
          aria-label="Go to previous page"
        >
          Previous
        </Button>
        <span className="text-sm font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="neutral"
          size="sm"
          onClick={() => {
            setPendingPage(page + 1);
            onPageChange(page + 1);
          }}
          disabled={loading || isLastPage}
          loading={loading && pendingPage === page + 1}
          loadingText="Next"
          aria-disabled={isLastPage}
          aria-label="Go to next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
