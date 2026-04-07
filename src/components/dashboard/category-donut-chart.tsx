'use client';

import { useCallback, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from '@/components/dashboard/chart-tooltip';
import { cn } from '@/lib/utils';

interface CategoryDonutChartProps {
  data: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  totalSpending: number; // cents, for center label
  activeCategoryId?: string | null; // currently filtered category
  onCategoryClick: (categoryId: string | null) => void;
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const OTHER_COLOR = 'rgba(0,0,0,0.3)';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(cents / 100);
}

// Custom active shape that expands outward by 4px on hover
function renderActiveShape(props: PieSectorDataItem) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={(outerRadius as number) + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--secondary-background)"
      strokeWidth={2}
    />
  );
}

export function CategoryDonutChart({
  data,
  totalSpending,
  activeCategoryId,
  onCategoryClick,
}: CategoryDonutChartProps) {
  // Sort by amount descending
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.amount - a.amount);

    // Group 6+ categories into "Other"
    if (sorted.length <= 5) return sorted;

    const top5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const otherAmount = rest.reduce((sum, item) => sum + item.amount, 0);
    const totalAmount = sorted.reduce((sum, item) => sum + item.amount, 0);
    const otherPercentage =
      totalAmount > 0 ? Math.round((otherAmount / totalAmount) * 100) : 0;

    return [
      ...top5,
      {
        categoryId: '__other__',
        categoryName: 'Other',
        amount: otherAmount,
        percentage: otherPercentage,
      },
    ];
  }, [data]);

  const getColor = useCallback(
    (index: number) => {
      if (index < 5) return CHART_COLORS[index];
      return OTHER_COLOR;
    },
    []
  );

  const handleSegmentClick = useCallback(
    (categoryId: string) => {
      if (categoryId === activeCategoryId) {
        onCategoryClick(null);
      } else {
        onCategoryClick(categoryId);
      }
    },
    [activeCategoryId, onCategoryClick]
  );

  // Tooltip formatter
  const tooltipFormatter = useCallback(
    (value: number, _name: string, payload: Record<string, unknown>) => {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">
            {(payload as unknown as { categoryName: string }).categoryName}
          </span>
          <span className="text-sm font-medium">{formatCurrency(value)}</span>
          <span className="text-sm font-medium opacity-40">
            {(payload as unknown as { percentage: number }).percentage}%
          </span>
        </div>
      );
    },
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Donut chart */}
          <div
            className="flex-1 min-h-[260px]"
            role="img"
            aria-label="Spending breakdown by category"
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sortedData}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  stroke="var(--secondary-background)"
                  strokeWidth={2}
                  activeShape={renderActiveShape}
                  cursor="pointer"
                  onClick={(_, index) =>
                    handleSegmentClick(sortedData[index].categoryId)
                  }
                >
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={entry.categoryId}
                      fill={getColor(index)}
                      fillOpacity={
                        activeCategoryId &&
                        activeCategoryId !== entry.categoryId
                          ? 0.3
                          : 1
                      }
                    />
                  ))}
                  <Label
                    value={formatCurrency(totalSpending)}
                    position="center"
                    className="text-2xl font-bold fill-foreground"
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                    }}
                  />
                </Pie>
                <Tooltip
                  content={<ChartTooltip formatter={tooltipFormatter} />}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend */}
          <div className="flex-1 flex flex-col gap-2 justify-center">
            {sortedData.map((entry, index) => (
              <button
                key={entry.categoryId}
                type="button"
                className={cn(
                  'flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded-base hover:bg-background transition-colors text-left w-full',
                  activeCategoryId &&
                    activeCategoryId !== entry.categoryId &&
                    'opacity-30'
                )}
                onClick={() => handleSegmentClick(entry.categoryId)}
              >
                <span
                  className="w-3 h-3 shrink-0 border-2 border-border rounded-base"
                  style={{ backgroundColor: getColor(index) }}
                />
                <span className="text-sm font-medium flex-1 truncate">
                  {entry.categoryName}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(entry.amount)}
                </span>
                <span className="text-sm font-medium tabular-nums opacity-40 w-10 text-right">
                  {entry.percentage}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Screen reader accessible data table */}
        <table className="sr-only">
          <caption>Spending breakdown by category</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((entry) => (
              <tr key={entry.categoryId}>
                <td>{entry.categoryName}</td>
                <td>{formatCurrency(entry.amount)}</td>
                <td>{entry.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
