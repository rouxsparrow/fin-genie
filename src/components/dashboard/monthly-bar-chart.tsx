'use client';

import { useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from '@/components/dashboard/chart-tooltip';

interface MonthlyBarChartProps {
  data: Array<{ month: string; label: string; amount: number }>;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(cents / 100);
}

function formatYAxisTick(value: number): string {
  if (value >= 100000) {
    return `$${(value / 100000).toFixed(0)}k`;
  }
  return `$${(value / 100).toFixed(0)}`;
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  // Tooltip formatter
  const tooltipFormatter = useCallback(
    (value: number, _name: string, payload: Record<string, unknown>) => {
      const month = (payload as unknown as { month: string }).month;
      const fullMonthLabel = format(parseISO(`${month}-01`), 'MMMM yyyy');

      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">{fullMonthLabel}</span>
          <span className="text-sm font-medium">{formatCurrency(value)}</span>
        </div>
      );
    },
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div
            className="flex items-center justify-center min-h-[320px]"
            role="img"
            aria-label="Monthly spending trend"
          >
            <p className="text-base font-medium opacity-60">
              No spending data for this period
            </p>
          </div>
        ) : (
          <>
            <div
              className="min-h-[320px]"
              role="img"
              aria-label="Monthly spending trend"
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data}>
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
                    activeBar={{ fillOpacity: 0.85 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Screen reader accessible data table */}
            <table className="sr-only">
              <caption>Monthly spending trend</caption>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry.month}>
                    <td>
                      {format(parseISO(`${entry.month}-01`), 'MMMM yyyy')}
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
