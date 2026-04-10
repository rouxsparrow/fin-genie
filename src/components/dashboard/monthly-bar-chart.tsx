"use client";

import { useCallback } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import type {
  CategoryTrendItem,
  MonthlyTrendItem,
} from "@/app/actions/analytics-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";

type MonthlyBarChartProps =
  | {
      variant: "time-series";
      title: string;
      data: MonthlyTrendItem[];
      reserveTopSpace?: boolean;
    }
  | {
      variant: "category-trends";
      data: CategoryTrendItem[];
    };

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

function formatYAxisTick(value: number): string {
  if (value >= 100000) {
    return `$${(value / 100000).toFixed(0)}k`;
  }

  return `$${(value / 100).toFixed(0)}`;
}

function CategoryTrendList({ data }: { data: CategoryTrendItem[] }) {
  if (data.length === 0) {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center"
        role="img"
        aria-label="Category trends"
      >
        <p className="text-base font-medium opacity-60">
          No category changes for this month
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col gap-3">
      {data.slice(0, 6).map((item) => {
        const Icon =
          item.direction === "up"
            ? ArrowUpRight
            : item.direction === "down"
              ? ArrowDownRight
              : Minus;
        const deltaText = `${item.deltaPercent && item.deltaPercent > 0 ? "+" : ""}${Math.round(item.deltaPercent ?? 0)}%`;
        const deltaClassName =
          item.direction === "up"
            ? "text-[#d97706]"
            : item.direction === "down"
              ? "text-[#16a34a]"
              : "text-foreground opacity-60";

        return (
          <div
            key={item.categoryId}
            className="flex items-center justify-between gap-4 rounded-base border-2 border-border bg-secondary-background p-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <p className="truncate text-base font-bold">
                {item.categoryName}
              </p>
              <p className="shrink-0 text-sm font-medium opacity-70">
                {formatCurrency(item.currentAmount)}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-bold ${deltaClassName}`}
            >
              <Icon className="h-4 w-4" />
              <span>{deltaText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlyBarChart(props: MonthlyBarChartProps) {
  const tooltipFormatter = useCallback(
    (value: number, _name: string, payload: Record<string, unknown>) => {
      const periodStart = payload.periodStart as string | undefined;
      const periodEnd = payload.periodEnd as string | undefined;
      const bucket = payload.bucket as MonthlyTrendItem["bucket"] | undefined;

      const label =
        bucket === "month" && periodStart
          ? format(parseISO(periodStart), "MMMM yyyy")
          : periodStart && periodEnd
            ? `${format(parseISO(periodStart), "d MMM yyyy")} - ${format(parseISO(periodEnd), "d MMM yyyy")}`
            : "Selected period";

      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">{label}</span>
          <span className="text-sm font-medium">{formatCurrency(value)}</span>
        </div>
      );
    },
    [],
  );

  if (props.variant === "category-trends") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Category Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryTrendList data={props.data} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {props.data.length === 0 ? (
          <div
            className="flex min-h-[320px] items-center justify-center"
            role="img"
            aria-label={props.title}
          >
            <p className="text-base font-medium opacity-60">
              No spending data for this period
            </p>
          </div>
        ) : (
          <>
            {props.reserveTopSpace && <div className="min-h-[88px]" />}
            <div className="min-h-[320px]" role="img" aria-label={props.title}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={props.data} accessibilityLayer={false}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 12,
                      fontWeight: 500,
                      fillOpacity: 0.6,
                    }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={props.data.length > 8 ? -20 : 0}
                    textAnchor={props.data.length > 8 ? "end" : "middle"}
                    height={props.data.length > 8 ? 52 : 30}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
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
                    fill="var(--chart-1)"
                    stroke="var(--border)"
                    strokeWidth={2}
                    radius={[5, 5, 0, 0]}
                    activeBar={{ fillOpacity: 0.85, strokeWidth: 2 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="sr-only">
              <caption>{props.title}</caption>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {props.data.map((entry) => (
                  <tr key={entry.key}>
                    <td>
                      {entry.bucket === "month"
                        ? format(parseISO(entry.periodStart), "MMMM yyyy")
                        : `${format(parseISO(entry.periodStart), "d MMM yyyy")} - ${format(parseISO(entry.periodEnd), "d MMM yyyy")}`}
                    </td>
                    <td>{formatCurrency(entry.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
