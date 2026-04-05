'use client';

import { BarChart3 } from 'lucide-react';
import { useProfile } from '@/lib/hooks/use-profile';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="max-w-[480px] mx-auto">
      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-[60%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[70%]" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <DashboardSkeleton />
      ) : profile?.role === 'admin' ? (
        <EmptyState
          icon={BarChart3}
          heading="No spending data yet"
          body="Upload your first bank statement to start tracking where your money goes."
          ctaLabel="Import Statement"
          ctaDisabled={true}
          ctaDisabledTooltip="Available in the next update"
        />
      ) : (
        <EmptyState
          icon={BarChart3}
          heading="No spending data yet"
          body="Ask your admin to import a statement to start viewing spending data."
        />
      )}
    </div>
  );
}
