'use client';

import { useMemo } from 'react';
import {
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  isBefore,
  isAfter,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimelineBarProps {
  imports: Array<{
    statement_period_start: string | null;
    statement_period_end: string | null;
    transaction_count: number;
  }>;
}

interface Segment {
  key: string;
  label: string;
  shortLabel: string;
  tooltip: string;
  status: 'filled' | 'gap' | 'future';
}

export function TimelineBar({ imports }: TimelineBarProps) {
  const segments = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);

    // Find earliest start and latest end across all imports
    let earliest: Date | null = null;
    let latest: Date | null = null;

    // Build a map of covered months with transaction counts
    const coveredMonths = new Map<string, number>();

    for (const imp of imports) {
      if (!imp.statement_period_start || !imp.statement_period_end) continue;

      const start = parseISO(imp.statement_period_start);
      const end = parseISO(imp.statement_period_end);

      if (!earliest || isBefore(start, earliest)) {
        earliest = start;
      }
      if (!latest || isAfter(end, latest)) {
        latest = end;
      }

      // Determine which months this import covers
      const months = eachMonthOfInterval({
        start: startOfMonth(start),
        end: startOfMonth(end),
      });

      for (const month of months) {
        const key = format(month, 'yyyy-MM');
        coveredMonths.set(
          key,
          (coveredMonths.get(key) ?? 0) + imp.transaction_count,
        );
      }
    }

    // If no valid date data, show nothing
    if (!earliest) return [];

    // Determine range: earliest month to current month
    const rangeStart = startOfMonth(earliest);
    const rangeEnd = currentMonth;

    // Generate all months in range
    const allMonths = eachMonthOfInterval({
      start: rangeStart,
      end: rangeEnd,
    });

    // Ensure minimum 6 segments for visual context
    const minSegments = 6;
    let monthsToShow = allMonths;
    if (monthsToShow.length < minSegments) {
      // Extend backwards to reach minimum
      const extendedStart = new Date(rangeStart);
      extendedStart.setMonth(
        extendedStart.getMonth() - (minSegments - monthsToShow.length),
      );
      monthsToShow = eachMonthOfInterval({
        start: startOfMonth(extendedStart),
        end: rangeEnd,
      });
    }

    // Build segments
    return monthsToShow.map((month, index): Segment => {
      const key = format(month, 'yyyy-MM');
      const monthLabel = format(month, 'MMM yyyy');
      const isJanuary = month.getMonth() === 0;
      const isFirst = index === 0;
      const shortLabel =
        isJanuary || isFirst
          ? format(month, "MMM ''yy")
          : format(month, 'MMM');
      const count = coveredMonths.get(key);
      const isCurrentOrPast = !isAfter(month, currentMonth);

      let status: Segment['status'];
      let tooltip: string;

      if (count !== undefined && count > 0) {
        status = 'filled';
        tooltip = `${monthLabel}: ${count} transactions imported`;
      } else if (isCurrentOrPast) {
        status = 'gap';
        tooltip = `${monthLabel}: No data`;
      } else {
        status = 'future';
        tooltip = `${monthLabel}: Future`;
      }

      return { key, label: monthLabel, shortLabel, tooltip, status };
    });
  }, [imports]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="bg-secondary-background border-2 border-border rounded-base p-4">
      <h3 className="text-sm font-bold">Statement Coverage</h3>
      <div className="h-2" />
      <div
        className="flex flex-wrap gap-0.5"
        role="group"
        aria-label="Statement coverage timeline"
      >
        {segments.map((segment) => (
          <TooltipProvider key={segment.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  role="img"
                  aria-label={`${segment.label}: ${segment.tooltip}`}
                  className={cn(
                    'h-8 flex-1 min-w-[40px] flex items-center justify-center text-sm font-medium border border-border first:rounded-l-base last:rounded-r-base',
                    segment.status === 'filled' &&
                      'bg-[#16a34a] text-white',
                    segment.status === 'gap' &&
                      'bg-[#ef4444]/20 text-foreground',
                    segment.status === 'future' &&
                      'bg-secondary-background text-foreground/40',
                  )}
                >
                  {segment.shortLabel}
                </div>
              </TooltipTrigger>
              <TooltipContent>{segment.tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
