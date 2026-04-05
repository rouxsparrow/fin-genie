import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-[120px] mb-8" />

      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-[220px]" />
        <Skeleton className="h-10 w-[130px]" />
      </div>

      <div className="flex flex-col gap-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[44px] w-full" />
        ))}
      </div>
    </div>
  );
}
