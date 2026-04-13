"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BarChart3 } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { DateRangeSelector } from "@/components/dashboard/date-range-selector";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { StatCardGrid } from "@/components/dashboard/stat-card-grid";
import {
  fetchCategoryBreakdown,
  fetchCategoryComparisonSeries,
  fetchCategoryTrends,
  fetchDashboardDrilldownTransactions,
  fetchDashboardStats,
  fetchMonthlyTrend,
  fetchTransactionList,
  type CategoryBreakdownItem,
  type CategoryComparisonSeries,
  type CategoryTrendItem,
  type DashboardStats,
  type MonthlyTrendItem,
  type TransactionWithCategory,
} from "@/app/actions/analytics-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useProfile } from "@/lib/hooks/use-profile";

const PAGE_SIZE = 10;

type DrilldownType =
  | "top-category"
  | "largest-transactions"
  | "subscriptions"
  | null;

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[140px] w-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>

      <Card>
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-10 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="mb-2 h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCurrency(cents: number, isDebit: boolean = true) {
  const formatted = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

function ModalTransactionList({
  transactions,
}: {
  transactions: TransactionWithCategory[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <p className="text-base font-medium opacity-60">
          No matching transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="rounded-base border-2 border-border bg-secondary-background p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="truncate text-base font-bold">
                {transaction.description}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium opacity-60">
                  {format(parseISO(transaction.transaction_date), "d MMM yyyy")}
                </span>
                {transaction.categories && (
                  <Badge
                    variant={
                      transaction.categories.is_system ? "neutral" : "default"
                    }
                  >
                    {transaction.categories.name}
                  </Badge>
                )}
              </div>
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums">
              {formatCurrency(transaction.amount_cents, transaction.is_debit)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { profile, loading: profileLoading } = useProfile();
  const { from, to, analysisMode } = useDateRange();
  const [categoryId, setCategoryId] = useQueryState(
    "category",
    parseAsString.withDefault(""),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("transaction_date"),
  );
  const [dir, setDir] = useQueryState("dir", parseAsString.withDefault("desc"));

  const activeCategoryId = categoryId || null;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [timeSeries, setTimeSeries] = useState<MonthlyTrendItem[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrendItem[]>([]);
  const [categoryComparison, setCategoryComparison] =
    useState<CategoryComparisonSeries>({
      categories: [],
      series: {},
    });
  const [selectedComparisonCategoryId, setSelectedComparisonCategoryId] =
    useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    [],
  );
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [activeDrilldown, setActiveDrilldown] = useState<DrilldownType>(null);
  const [drilldownTransactions, setDrilldownTransactions] = useState<
    TransactionWithCategory[]
  >([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const isInitialAnalyticsLoad = useRef(true);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [from, to, activeCategoryId, debouncedSearch, sort, dir, setPage]);

  const activeCategoryName = useMemo(
    () =>
      activeCategoryId
        ? (breakdown.find((item) => item.categoryId === activeCategoryId)
            ?.categoryName ?? null)
        : null,
    [activeCategoryId, breakdown],
  );

  const loadAnalytics = useCallback(async () => {
    if (isInitialAnalyticsLoad.current) {
      setAnalyticsLoading(true);
    } else {
      setTransitioning(true);
    }

    try {
      const chartPromise =
        analysisMode === "single-month"
          ? fetchCategoryTrends(from, to)
          : fetchMonthlyTrend(
              from,
              to,
              analysisMode === "custom-range" ? "auto" : "month",
            );
      const comparisonPromise =
        analysisMode === "multi-month-preset"
          ? fetchCategoryComparisonSeries(from, to)
          : null;

      const [statsResult, breakdownResult, chartResult, comparisonResult] =
        await Promise.all([
          fetchDashboardStats(from, to),
          fetchCategoryBreakdown(from, to),
          chartPromise,
          comparisonPromise ?? Promise.resolve(null),
        ]);

      if (!statsResult.success) {
        toast("Could not load spending data. Please try refreshing.");
        return;
      }

      setStats(statsResult.data);

      if (breakdownResult.success) {
        setBreakdown(breakdownResult.data);
      } else {
        setBreakdown([]);
      }

      if (analysisMode === "single-month") {
        if (chartResult.success) {
          setCategoryTrends(chartResult.data as CategoryTrendItem[]);
        } else {
          setCategoryTrends([]);
        }
        setTimeSeries([]);
        setCategoryComparison({ categories: [], series: {} });
        setSelectedComparisonCategoryId(null);
      } else {
        if (chartResult.success) {
          setTimeSeries(chartResult.data as MonthlyTrendItem[]);
        } else {
          setTimeSeries([]);
        }
        setCategoryTrends([]);

        if (
          analysisMode === "multi-month-preset" &&
          comparisonResult &&
          comparisonResult.success
        ) {
          setCategoryComparison(comparisonResult.data);
          setSelectedComparisonCategoryId((current) =>
            current &&
            comparisonResult.data.categories.some(
              (item) => item.categoryId === current,
            )
              ? current
              : (comparisonResult.data.categories[0]?.categoryId ?? null),
          );
        } else {
          setCategoryComparison({ categories: [], series: {} });
          setSelectedComparisonCategoryId(null);
        }
      }
    } catch {
      toast("Could not load spending data. Please try refreshing.");
    } finally {
      setAnalyticsLoading(false);
      setTransitioning(false);
      isInitialAnalyticsLoad.current = false;
    }
  }, [analysisMode, from, to]);

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);

    try {
      const result = await fetchTransactionList({
        from,
        to,
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: activeCategoryId ?? undefined,
        sortBy: sort || "transaction_date",
        sortDir: (dir as "asc" | "desc") || "desc",
        spendingOnly: true,
        excludeExcludedCategories: true,
      });

      if (!result.success) {
        toast("Could not load spending data. Please try refreshing.");
        return;
      }

      setTransactions(result.data.transactions);
      setTransactionTotal(result.data.total);
      setTransactionTotalPages(result.data.totalPages);
    } catch {
      toast("Could not load spending data. Please try refreshing.");
    } finally {
      setTransactionsLoading(false);
    }
  }, [activeCategoryId, debouncedSearch, dir, from, page, sort, to]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!activeDrilldown) {
      setDrilldownTransactions([]);
      return;
    }

    const drilldownType = activeDrilldown;
    let cancelled = false;

    async function loadDrilldown() {
      setDrilldownLoading(true);

      const result = await fetchDashboardDrilldownTransactions({
        type: drilldownType,
        from,
        to,
        categoryId: stats?.topCategory?.categoryId,
        limit: drilldownType === "largest-transactions" ? 5 : undefined,
      });

      if (cancelled) {
        return;
      }

      if (result.success) {
        setDrilldownTransactions(result.data);
      } else {
        setDrilldownTransactions([]);
        toast("Could not load spending data. Please try refreshing.");
      }

      setDrilldownLoading(false);
    }

    loadDrilldown();

    return () => {
      cancelled = true;
    };
  }, [activeDrilldown, from, stats?.topCategory?.categoryId, to]);

  const handleCategoryClick = useCallback(
    (nextCategoryId: string | null) => {
      setCategoryId(nextCategoryId ?? "");
    },
    [setCategoryId],
  );

  const handleClearFilter = useCallback(() => {
    setCategoryId("");
  }, [setCategoryId]);

  const handleSort = useCallback(
    (columnId: string) => {
      if (sort === columnId) {
        setDir(dir === "asc" ? "desc" : "asc");
      } else {
        setSort(columnId);
        setDir(columnId === "transaction_date" ? "desc" : "asc");
      }
    },
    [dir, setDir, setSort, sort],
  );

  const modalTitle =
    activeDrilldown === "top-category"
      ? "Top Category Transactions"
      : activeDrilldown === "largest-transactions"
        ? "Largest Transactions"
        : activeDrilldown === "subscriptions"
          ? "Subscriptions Transactions"
          : "";

  const isEmpty =
    !analyticsLoading &&
    stats !== null &&
    stats.totalSpending === 0 &&
    transactionTotal === 0;
  const chartSection = (
    <>
      {analysisMode === "custom-range" ? (
        <>
          <div className="mb-8">
            <CategoryDonutChart
              variant="donut"
              data={breakdown}
              totalSpending={stats?.totalSpending ?? 0}
              activeCategoryId={activeCategoryId}
              onCategoryClick={handleCategoryClick}
            />
          </div>
          <div className="mb-8">
            <MonthlyBarChart
              variant="time-series"
              title="Spending Over Time"
              data={timeSeries}
            />
          </div>
        </>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {analysisMode === "multi-month-preset" ? (
            <CategoryDonutChart
              variant="bar"
              comparison={categoryComparison}
              selectedCategoryId={selectedComparisonCategoryId}
              onCategorySelect={setSelectedComparisonCategoryId}
            />
          ) : (
            <CategoryDonutChart
              variant="donut"
              data={breakdown}
              totalSpending={stats?.totalSpending ?? 0}
              activeCategoryId={activeCategoryId}
              onCategoryClick={handleCategoryClick}
            />
          )}

          {analysisMode === "single-month" ? (
            <MonthlyBarChart variant="category-trends" data={categoryTrends} />
          ) : (
            <MonthlyBarChart
              variant="time-series"
              title="Monthly Spending"
              data={timeSeries}
              reserveTopSpace={analysisMode === "multi-month-preset"}
            />
          )}
        </div>
      )}
    </>
  );

  if (profileLoading) {
    return (
      <div>
        <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <DateRangeSelector loading={transitioning} />
        </div>
        {profile?.role === "admin" ? (
          <EmptyState
            icon={<BarChart3 size={48} />}
            heading="No spending data yet"
            body="Upload your first bank statement to start tracking where your money goes."
            ctaLabel="Import Statement"
            ctaHref="/import"
            altText="Or try a different date range above."
          />
        ) : (
          <EmptyState
            icon={<BarChart3 size={48} />}
            heading="No spending data yet"
            body="Ask your admin to import a statement to start viewing spending data."
            altText="Or try a different date range above."
          />
        )}
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <DateRangeSelector loading={transitioning} />
        </div>

      {analyticsLoading || !stats ? (
        <DashboardSkeleton />
      ) : (
        <div
          className={
            transitioning
              ? "opacity-50 transition-opacity duration-300"
              : "transition-opacity duration-300"
          }
        >
          <div className="mb-8">
            <StatCardGrid
              mode={analysisMode}
              stats={stats}
              onTopCategoryClick={
                analysisMode === "single-month" && stats.topCategory
                  ? () => setActiveDrilldown("top-category")
                  : undefined
              }
              onLargestTransactionClick={
                stats.largestTransaction
                  ? () => setActiveDrilldown("largest-transactions")
                  : undefined
              }
              onRecurringSpendClick={
                stats.recurringSpend.total > 0
                  ? () => setActiveDrilldown("subscriptions")
                  : undefined
              }
            />
          </div>

          {chartSection}

          <RecentTransactions
            transactions={transactions}
            total={transactionTotal}
            page={page}
            totalPages={transactionTotalPages}
            pageSize={PAGE_SIZE}
            search={search}
            sortBy={sort}
            sortDir={(dir as "asc" | "desc") || "desc"}
            loading={transactionsLoading}
            paginationLoading={transactionsLoading}
            categoryName={activeCategoryName}
            onSearchChange={(value) => setSearch(value || null)}
            onSort={handleSort}
            onPageChange={setPage}
            onClearFilter={handleClearFilter}
          />
        </div>
      )}

      <Dialog
        open={activeDrilldown !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDrilldown(null);
          }
        }}
      >
        <DialogContent className="top-4 flex max-h-[calc(100vh-2rem)] max-w-4xl translate-y-0 flex-col overflow-hidden p-5 sm:top-6 sm:max-h-[calc(100vh-3rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {drilldownLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <ModalTransactionList transactions={drilldownTransactions} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
