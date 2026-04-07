'use client';

import { useQueryStates, parseAsString } from 'nuqs';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  format,
} from 'date-fns';

export type DatePreset =
  | 'this-month'
  | 'last-3-months'
  | 'last-6-months'
  | 'this-year'
  | 'custom';

export function useDateRange() {
  const today = new Date();
  const defaultFrom = format(startOfMonth(today), 'yyyy-MM-dd');
  const defaultTo = format(endOfMonth(today), 'yyyy-MM-dd');

  const [params, setParams] = useQueryStates({
    from: parseAsString.withDefault(defaultFrom),
    to: parseAsString.withDefault(defaultTo),
    preset: parseAsString.withDefault('this-month'),
  });

  function setPreset(preset: DatePreset) {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case 'this-month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last-3-months':
        from = startOfMonth(subMonths(now, 2));
        to = endOfMonth(now);
        break;
      case 'last-6-months':
        from = startOfMonth(subMonths(now, 5));
        to = endOfMonth(now);
        break;
      case 'this-year':
        from = startOfYear(now);
        to = endOfMonth(now);
        break;
      default:
        // custom is handled separately via setCustomRange
        return;
    }

    setParams({
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
      preset,
    });
  }

  function setCustomRange(from: Date, to: Date) {
    setParams({
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
      preset: 'custom',
    });
  }

  return {
    from: params.from,
    to: params.to,
    preset: params.preset as DatePreset,
    setPreset,
    setCustomRange,
  };
}
