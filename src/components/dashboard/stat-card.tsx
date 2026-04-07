'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ComparisonItem {
  text: string;
  direction: 'up' | 'down' | 'neutral';
}

export interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  comparison?: ComparisonItem[];
  subtext?: string;
  subtextClassName?: string;
}

const directionConfig = {
  up: {
    Icon: TrendingUp,
    color: 'text-[#d97706]', // amber-600 for increase (spending went up)
  },
  down: {
    Icon: TrendingDown,
    color: 'text-[#16a34a]', // green-600 for decrease (spending went down)
  },
  neutral: {
    Icon: Minus,
    color: 'text-foreground opacity-60',
  },
};

export function StatCard({
  label,
  value,
  valueClassName,
  comparison,
  subtext,
  subtextClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <p className="text-sm font-medium opacity-60">{label}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">
        <p
          className={cn(
            'text-2xl font-bold tabular-nums',
            valueClassName
          )}
        >
          {value}
        </p>

        {comparison && comparison.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {comparison.map((item, index) => {
              const { Icon, color } = directionConfig[item.direction];
              return (
                <div key={index} className={cn('flex items-center gap-1', color)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {subtext && (
          <p
            className={cn(
              'text-base font-medium',
              subtextClassName
            )}
          >
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
