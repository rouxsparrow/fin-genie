"use client";

import type { DashboardAnalysisMode } from "@/lib/hooks/use-date-range";
import type { DashboardStats } from "@/app/actions/analytics-actions";
import {
  StatCard,
  type ComparisonItem,
} from "@/components/dashboard/stat-card";

interface StatCardGridProps {
  mode: DashboardAnalysisMode;
  stats: DashboardStats;
  onTopCategoryClick?: () => void;
  onLargestTransactionClick?: () => void;
  onRecurringSpendClick?: () => void;
}

function formatCurrency(cents: number | null): string {
  if (cents === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function toComparison(percent: number | null, label: string): ComparisonItem {
  if (percent === null) {
    return {
      text: `-- ${label}`,
      direction: "neutral",
    };
  }

  if (percent === 0) {
    return {
      text: `0% ${label}`,
      direction: "neutral",
    };
  }

  return {
    text: `${Math.abs(Math.round(percent))}% ${label}`,
    direction: percent > 0 ? "up" : "down",
  };
}

function TopCategoriesList({
  items,
}: {
  items: DashboardStats["topCategories"];
}) {
  if (items.length === 0) {
    return <p className="text-sm font-medium opacity-40">No transactions</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => (
        <div
          key={item.categoryId}
          className="flex items-center justify-between gap-3 text-sm font-medium"
        >
          <span className="truncate opacity-70">
            {index + 1}. {item.name}
          </span>
          <span className="shrink-0 tabular-nums">
            {formatCurrency(item.amount)} · {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatCardGrid({
  mode,
  stats,
  onTopCategoryClick,
  onLargestTransactionClick,
  onRecurringSpendClick,
}: StatCardGridProps) {
  if (mode === "single-month") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Spending"
          value={formatCurrency(stats.totalSpending)}
          valueClassName="text-[32px] font-bold tabular-nums"
          comparison={[
            toComparison(stats.previousPeriodChange, "vs last month"),
            toComparison(
              stats.sameMonthAverageChange,
              `vs ${stats.sameMonthAverageLabel}`,
            ),
          ]}
        />
        <StatCard
          label="Top Category"
          value={stats.topCategory?.name ?? "--"}
          subtext={
            stats.topCategory
              ? `${formatCurrency(stats.topCategory.amount)} · ${stats.topCategory.percentage}%`
              : "No transactions"
          }
          onClick={stats.topCategory ? onTopCategoryClick : undefined}
        />
        <StatCard
          label="Largest Transaction"
          value={
            stats.largestTransaction
              ? formatCurrency(stats.largestTransaction.amount)
              : "--"
          }
          valueClassName="text-2xl font-bold tabular-nums"
          subtext={
            stats.largestTransaction
              ? truncate(stats.largestTransaction.description, 30)
              : "No transactions"
          }
          onClick={
            stats.largestTransaction ? onLargestTransactionClick : undefined
          }
        />
        <StatCard
          label="Recurring Spend"
          value={formatCurrency(stats.recurringSpend.total)}
          valueClassName="text-2xl font-bold tabular-nums"
          subtext={
            stats.recurringSpend.total > 0
              ? "Subscriptions"
              : "No subscriptions category"
          }
          subtextClassName={
            stats.recurringSpend.total > 0 ? undefined : "opacity-40"
          }
          onClick={
            stats.recurringSpend.total > 0 ? onRecurringSpendClick : undefined
          }
        />
      </div>
    );
  }

  if (mode === "multi-month-preset") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average Monthly Amount"
          value={formatCurrency(stats.averageMonthlyAmount)}
          comparison={[
            {
              text: `Highest ${formatCurrency(stats.highestMonth?.amount ?? null)}`,
              direction: "neutral",
            },
            {
              text: `Lowest ${formatCurrency(stats.lowestMonth?.amount ?? null)}`,
              direction: "neutral",
            },
          ]}
          footerContent={
            <div className="text-sm font-medium opacity-60">
              {stats.highestMonth?.label ?? "--"} /{" "}
              {stats.lowestMonth?.label ?? "--"}
            </div>
          }
        />
        <StatCard
          label="Top 3 Categories"
          value={
            stats.topCategories.length > 0
              ? `${stats.topCategories.length} categories`
              : "--"
          }
          footerContent={<TopCategoriesList items={stats.topCategories} />}
        />
        <StatCard
          label="Largest Transaction"
          value={
            stats.largestTransaction
              ? formatCurrency(stats.largestTransaction.amount)
              : "--"
          }
          valueClassName="text-2xl font-bold tabular-nums"
          subtext={
            stats.largestTransaction
              ? truncate(stats.largestTransaction.description, 30)
              : "No transactions"
          }
          onClick={
            stats.largestTransaction ? onLargestTransactionClick : undefined
          }
        />
        <StatCard
          label="Recurring Spend"
          value={formatCurrency(stats.recurringSpend.total)}
          comparison={[
            {
              text: `Avg / month ${formatCurrency(
                stats.recurringSpend.averagePerMonth,
              )}`,
              direction: "neutral",
            },
          ]}
          subtext="Subscriptions"
          subtextClassName={
            stats.recurringSpend.total > 0 ? undefined : "opacity-40"
          }
          onClick={
            stats.recurringSpend.total > 0 ? onRecurringSpendClick : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Spending Amount"
        value={formatCurrency(stats.totalSpending)}
        comparison={[
          {
            text: `Avg / Day ${formatCurrency(stats.avgPerDay)}`,
            direction: "neutral",
          },
        ]}
      />
      <StatCard
        label="Top Categories"
        value={
          stats.topCategories.length > 0
            ? `${stats.topCategories.length} categories`
            : "--"
        }
        footerContent={<TopCategoriesList items={stats.topCategories} />}
      />
      <StatCard
        label="Largest Transaction"
        value={
          stats.largestTransaction
            ? formatCurrency(stats.largestTransaction.amount)
            : "--"
        }
        valueClassName="text-2xl font-bold tabular-nums"
        subtext={
          stats.largestTransaction
            ? truncate(stats.largestTransaction.description, 30)
            : "No transactions"
        }
        onClick={
          stats.largestTransaction ? onLargestTransactionClick : undefined
        }
      />
      <StatCard
        label="Total Days"
        value={`${stats.totalDays}`}
        subtext="Selected range"
      />
    </div>
  );
}
