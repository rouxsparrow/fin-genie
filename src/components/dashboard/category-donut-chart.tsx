"use client";

import { useCallback, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import type {
  CategoryBreakdownItem,
  CategoryComparisonSeries,
} from "@/app/actions/analytics-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CategoryDonutChartProps =
  | {
      variant: "donut";
      data: CategoryBreakdownItem[];
      totalSpending: number;
      activeCategoryId?: string | null;
      onCategoryClick: (categoryId: string | null) => void;
    }
  | {
      variant: "bar";
      comparison: CategoryComparisonSeries;
      selectedCategoryId: string | null;
      onCategorySelect: (categoryId: string) => void;
    };

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const OTHER_COLOR = "rgba(0,0,0,0.3)";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

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

function CategoryBarComparison({
  comparison,
  selectedCategoryId,
  onCategorySelect,
}: {
  comparison: CategoryComparisonSeries;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
}) {
  const selectedCategory =
    comparison.categories.find(
      (item) => item.categoryId === selectedCategoryId,
    ) ?? comparison.categories[0];
  const chartData = selectedCategory
    ? (comparison.series[selectedCategory.categoryId] ?? [])
    : [];

  const tooltipFormatter = useCallback(
    (value: number, _name: string, payload: Record<string, unknown>) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold">
          {selectedCategory?.categoryName ?? "Category"}
        </span>
        <span className="text-sm font-medium">
          {payload.label as string}: {formatCurrency(value)}
        </span>
      </div>
    ),
    [selectedCategory],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[88px] flex-wrap content-start gap-2">
        {comparison.categories.slice(0, 8).map((category) => (
          <Button
            key={category.categoryId}
            type="button"
            size="sm"
            variant={
              selectedCategory?.categoryId === category.categoryId
                ? "default"
                : "neutral"
            }
            onClick={() => onCategorySelect(category.categoryId)}
          >
            {category.categoryName}
          </Button>
        ))}
      </div>

      <div
        className="min-h-[320px]"
        role="img"
        aria-label="Category comparison through the selected period"
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} accessibilityLayer={false}>
            <XAxis
              dataKey="label"
              tick={{
                fontSize: 12,
                fontWeight: 500,
                fillOpacity: 0.8,
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) =>
                formatCurrency(value).replace(".00", "")
              }
              tick={{
                fontSize: 12,
                fontWeight: 500,
                fillOpacity: 0.6,
              }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatter={tooltipFormatter} />}
              cursor={false}
            />
            <Bar
              dataKey="amount"
              radius={[5, 5, 0, 0]}
              stroke="var(--border)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryDonutChart(props: CategoryDonutChartProps) {
  const isBarVariant = props.variant === "bar";

  const sortedData = useMemo(() => {
    if (isBarVariant) {
      return [];
    }

    const sorted = [...props.data].sort(
      (left, right) => right.amount - left.amount,
    );

    if (sorted.length <= 5) {
      return sorted;
    }

    const top5 = sorted.slice(0, 5);
    const otherAmount = sorted
      .slice(5)
      .reduce((sum, item) => sum + item.amount, 0);
    const totalAmount = sorted.reduce((sum, item) => sum + item.amount, 0);

    return [
      ...top5,
      {
        categoryId: "__other__",
        categoryName: "Other",
        amount: otherAmount,
        percentage:
          totalAmount > 0 ? Math.round((otherAmount / totalAmount) * 100) : 0,
      },
    ];
  }, [isBarVariant, props]);

  const getColor = useCallback((index: number) => {
    if (index < 5) {
      return CHART_COLORS[index];
    }

    return OTHER_COLOR;
  }, []);

  const donutTooltipFormatter = useCallback(
    (value: number, _name: string, payload: Record<string, unknown>) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold">
          {payload.categoryName as string}
        </span>
        <span className="text-sm font-medium">{formatCurrency(value)}</span>
        <span className="text-sm font-medium opacity-40">
          {payload.percentage as number}%
        </span>
      </div>
    ),
    [],
  );

  const handleSegmentClick = useCallback(
    (categoryId: string) => {
      if (!isBarVariant) {
        if (categoryId === props.activeCategoryId) {
          props.onCategoryClick(null);
          return;
        }

        props.onCategoryClick(categoryId);
      }
    },
    [isBarVariant, props],
  );

  if (isBarVariant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {props.comparison.categories.length === 0 ? (
            <div
              className="flex min-h-[320px] items-center justify-center"
              role="img"
              aria-label="Category comparison"
            >
              <p className="text-base font-medium opacity-60">
                No category data for this period
              </p>
            </div>
          ) : (
            <CategoryBarComparison
              comparison={props.comparison}
              selectedCategoryId={props.selectedCategoryId}
              onCategorySelect={props.onCategorySelect}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div
            className="min-h-[260px] flex-1"
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
                        props.activeCategoryId &&
                        props.activeCategoryId !== entry.categoryId
                          ? 0.3
                          : 1
                      }
                    />
                  ))}
                  <Label
                    value={formatCurrency(props.totalSpending)}
                    position="center"
                    className="fill-foreground text-2xl font-bold"
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                    }}
                  />
                </Pie>
                <Tooltip
                  content={<ChartTooltip formatter={donutTooltipFormatter} />}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-2">
            {sortedData.map((entry, index) => (
              <button
                key={entry.categoryId}
                type="button"
                className={cn(
                  "w-full cursor-pointer rounded-base px-1 py-0.5 text-left transition-colors hover:bg-background",
                  "flex items-center gap-2",
                  props.activeCategoryId &&
                    props.activeCategoryId !== entry.categoryId &&
                    "opacity-30",
                )}
                onClick={() => handleSegmentClick(entry.categoryId)}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-base border-2 border-border"
                  style={{ backgroundColor: getColor(index) }}
                />
                <span className="flex-1 truncate text-sm font-medium">
                  {entry.categoryName}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(entry.amount)}
                </span>
                <span className="w-10 text-right text-sm font-medium tabular-nums opacity-40">
                  {entry.percentage}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
