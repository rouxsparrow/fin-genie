'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import { useQueryState, parseAsString } from 'nuqs';
import { toast } from 'sonner';

import { useProfile } from '@/lib/hooks/use-profile';
import { useDateRange } from '@/lib/hooks/use-date-range';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangeSelector } from '@/components/dashboard/date-range-selector';
import { StatCardGrid } from '@/components/dashboard/stat-card-grid';
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart';
import { MonthlyBarChart } from '@/components/dashboard/monthly-bar-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { CategoryFilterBadge } from '@/components/dashboard/category-filter-badge';
import {
  fetchDashboardStats,
  fetchCategoryBreakdown,
  fetchMonthlyTrend,
  fetchRecentTransactions,
  type DashboardStats,
  type CategoryBreakdownItem,
  type MonthlyTrendItem,
  type TransactionWithCategory,
} from '@/app/actions/analytics-actions';

// ---- Loading Skeletons ----

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stat card skeletons */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>

      {/* Recent transactions skeleton */}
      <Card>
        <CardContent className="p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-1" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Dashboard Page ----

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { from, to } = useDateRange();

  // Category filter via URL param
  const [categoryId, setCategoryId] = useQueryState(
    'category',
    parseAsString.withDefault('')
  );
  const activeCategoryId = categoryId || null;

  // Dashboard data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [trend, setTrend] = useState<MonthlyTrendItem[]>([]);
  const [recentTxs, setRecentTxs] = useState<TransactionWithCategory[]>([]);
  const [recentTotal, setRecentTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const isInitialLoad = useRef(true);

  // Find the active category name for the filter badge
  const activeCategoryName =
    activeCategoryId && breakdown.length > 0
      ? breakdown.find((b) => b.categoryId === activeCategoryId)
          ?.categoryName ?? null
      : null;

  const loadDashboardData = useCallback(async () => {
    if (isInitialLoad.current) {
      setLoading(true);
    } else {
      setTransitioning(true);
    }

    try {
      const [statsResult, breakdownResult, trendResult, recentResult] =
        await Promise.all([
          fetchDashboardStats(from, to),
          fetchCategoryBreakdown(from, to),
          fetchMonthlyTrend(from, to),
          fetchRecentTransactions(from, to, 10, activeCategoryId ?? undefined),
        ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        toast('Could not load spending data. Please try refreshing.');
      }

      if (breakdownResult.success) {
        setBreakdown(breakdownResult.data);
      }

      if (trendResult.success) {
        setTrend(trendResult.data);
      }

      if (recentResult.success) {
        setRecentTxs(recentResult.data.transactions);
        setRecentTotal(recentResult.data.total);
      }
    } catch {
      toast('Could not load spending data. Please try refreshing.');
    } finally {
      setLoading(false);
      setTransitioning(false);
      isInitialLoad.current = false;
    }
  }, [from, to, activeCategoryId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle category click from donut chart
  const handleCategoryClick = useCallback(
    (catId: string | null) => {
      setCategoryId(catId ?? '');
    },
    [setCategoryId]
  );

  const handleClearFilter = useCallback(() => {
    setCategoryId('');
  }, [setCategoryId]);

  // Determine if we should show empty state
  const isEmpty =
    !loading &&
    stats !== null &&
    stats.totalSpending === 0 &&
    recentTxs.length === 0;

  // Profile still loading
  if (profileLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        {profile?.role === 'admin' ? (
          <EmptyState
            icon={<BarChart3 size={48} />}
            heading="No spending data yet"
            body="Upload your first bank statement to start tracking where your money goes."
            ctaLabel="Import Statement"
            ctaHref="/import"
          />
        ) : (
          <EmptyState
            icon={<BarChart3 size={48} />}
            heading="No spending data yet"
            body="Ask your admin to import a statement to start viewing spending data."
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* 1. Page header row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateRangeSelector />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div
          className={
            transitioning
              ? 'opacity-50 transition-opacity duration-300'
              : 'transition-opacity duration-300'
          }
        >
          {/* 2. Category filter badge (conditional) */}
          {activeCategoryId && activeCategoryName && (
            <div className="mb-4">
              <CategoryFilterBadge
                categoryName={activeCategoryName}
                onClear={handleClearFilter}
              />
            </div>
          )}

          {/* 3. Stat Card Grid */}
          {stats && (
            <div className="mb-8">
              <StatCardGrid
                totalSpending={stats.totalSpending}
                previousMonthSpending={stats.previousMonthSpending}
                monthlyAverage={stats.monthlyAverage}
                topCategory={stats.topCategory}
                largestTransaction={stats.largestTransaction}
                recurringSpend={stats.recurringSpend}
              />
            </div>
          )}

          {/* 4. Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CategoryDonutChart
              data={breakdown}
              totalSpending={stats?.totalSpending ?? 0}
              activeCategoryId={activeCategoryId}
              onCategoryClick={handleCategoryClick}
            />
            <MonthlyBarChart data={trend} />
          </div>

          {/* 5. Recent Transactions */}
          <RecentTransactions
            transactions={recentTxs}
            total={recentTotal}
            dateFrom={from}
            dateTo={to}
            categoryId={activeCategoryId}
          />
        </div>
      )}
    </div>
  );
}
