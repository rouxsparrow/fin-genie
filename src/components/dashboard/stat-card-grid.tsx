'use client';

import { StatCard, type ComparisonItem } from '@/components/dashboard/stat-card';

export interface StatCardGridProps {
  totalSpending: number; // cents
  previousMonthSpending: number | null;
  monthlyAverage: number | null;
  topCategory: { name: string; amount: number } | null;
  largestTransaction: { description: string; amount: number } | null;
  recurringSpend: number; // cents
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(cents / 100);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function calculatePercentChange(
  current: number,
  previous: number | null
): { text: string; direction: 'up' | 'down' | 'neutral' } | null {
  if (previous === null || previous === 0) {
    return null;
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(Math.round(change));

  if (change > 0) {
    return { text: `${rounded}%`, direction: 'up' };
  } else if (change < 0) {
    return { text: `${rounded}%`, direction: 'down' };
  }
  return { text: '0%', direction: 'neutral' };
}

export function StatCardGrid({
  totalSpending,
  previousMonthSpending,
  monthlyAverage,
  topCategory,
  largestTransaction,
  recurringSpend,
}: StatCardGridProps) {
  // Build comparison lines for Total Spending card
  const vsLastMonth = calculatePercentChange(
    totalSpending,
    previousMonthSpending
  );
  const vsMonthlyAvg = calculatePercentChange(totalSpending, monthlyAverage);

  const totalSpendingComparison: ComparisonItem[] = [];

  if (vsLastMonth) {
    totalSpendingComparison.push({
      text: `${vsLastMonth.text} vs last month`,
      direction: vsLastMonth.direction,
    });
  } else {
    totalSpendingComparison.push({
      text: '-- vs last month',
      direction: 'neutral',
    });
  }

  if (vsMonthlyAvg) {
    totalSpendingComparison.push({
      text: `${vsMonthlyAvg.text} vs monthly avg`,
      direction: vsMonthlyAvg.direction,
    });
  } else {
    totalSpendingComparison.push({
      text: '-- vs monthly avg',
      direction: 'neutral',
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Spending */}
      <StatCard
        label="Total Spending"
        value={formatCurrency(totalSpending)}
        valueClassName="text-[32px] font-bold tabular-nums"
        comparison={totalSpendingComparison}
      />

      {/* Card 2: Top Category */}
      <StatCard
        label="Top Category"
        value={topCategory?.name ?? '--'}
        subtext={
          topCategory ? formatCurrency(topCategory.amount) : 'No transactions'
        }
      />

      {/* Card 3: Largest Transaction */}
      <StatCard
        label="Largest Transaction"
        value={
          largestTransaction
            ? formatCurrency(largestTransaction.amount)
            : '--'
        }
        valueClassName="text-2xl font-bold tabular-nums"
        subtext={
          largestTransaction
            ? truncate(largestTransaction.description, 30)
            : 'No transactions'
        }
      />

      {/* Card 4: Recurring Spend */}
      <StatCard
        label="Recurring Spend"
        value={formatCurrency(recurringSpend)}
        valueClassName="text-2xl font-bold tabular-nums"
        subtext={recurringSpend > 0 ? 'Subscriptions' : 'No subscriptions category'}
        subtextClassName={recurringSpend > 0 ? undefined : 'opacity-40'}
      />
    </div>
  );
}
