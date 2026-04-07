import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 md:p-8">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-9 w-[320px]" />
      </div>

      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Table header skeleton */}
      <Skeleton className="h-12 w-full" />

      {/* Table rows skeleton */}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-[120px]" />
      </div>
    </div>
  );
}
