'use client';

import * as React from 'react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: Record<string, unknown>;
  }>;
  formatter?: (
    value: number,
    name: string,
    payload: Record<string, unknown>
  ) => React.ReactNode;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(cents / 100);
}

export function ChartTooltip({ active, payload, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const value = item.value ?? 0;
  const name = item.name ?? '';

  return (
    <div className="bg-secondary-background border-2 border-border rounded-base p-2 shadow-shadow">
      {formatter ? (
        formatter(value, name, item.payload ?? {})
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">{name}</span>
          <span className="text-sm font-medium">{formatCurrency(value)}</span>
        </div>
      )}
    </div>
  );
}
