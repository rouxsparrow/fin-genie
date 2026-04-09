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
import type { CategoryBreakdownItem } from "@/app/actions/analytics-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
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
      data: CategoryBreakdownItem[];
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

function CategoryBarComparison({ data }: { data: CategoryBreakdownItem[] }) {
  const chartData = data.slice(0, 8);

  const tooltipFormatter = useCallback(
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

  return (
    <>
      <div
        className="min-h-[320px]"
        role="img"
        aria-label="Category comparison through the selected period"
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 12 }}>
            <XAxis
              type="number"
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
            <YAxis
              type="category"
              dataKey="categoryName"
              width={92}
              tick={{
                fontSize: 12,
                fontWeight: 500,
                fillOpacity: 0.8,
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
              radius={[0, 6, 6, 0]}
              stroke="var(--border)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.categoryId}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Category comparison through the selected period</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((entry) => (
            <tr key={entry.categoryId}>
              <td>{entry.categoryName}</td>
              <td>{formatCurrency(entry.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CategoryDonutChart(props: CategoryDonutChartProps) {
  const sortedData = useMemo(() => {
    const sorted = [...props.data].sort(
      (left, right) => right.amount - left.amount,
    );

    if (props.variant === "bar" || sorted.length <= 5) {
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
  }, [props]);

  if (props.variant === "bar") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedData.length === 0 ? (
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
            <CategoryBarComparison data={sortedData} />
          )}
        </CardContent>
      </Card>
    );
  }

  const getColor = useCallback((index: number) => {
    if (index < 5) {
      return CHART_COLORS[index];
    }

    return OTHER_COLOR;
  }, []);

  const tooltipFormatter = useCallback(
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
      if (categoryId === props.activeCategoryId) {
        props.onCategoryClick(null);
        return;
      }

      props.onCategoryClick(categoryId);
    },
    [props],
  );

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
                  content={<ChartTooltip formatter={tooltipFormatter} />}
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
