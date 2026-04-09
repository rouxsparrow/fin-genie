"use client";

import { parseAsString, useQueryStates } from "nuqs";
import {
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export type DatePreset =
  | "this-month"
  | "last-3-months"
  | "last-6-months"
  | "this-year"
  | "custom";

export type DashboardAnalysisMode =
  | "single-month"
  | "multi-month-preset"
  | "custom-range";

function getPresetRange(preset: Exclude<DatePreset, "custom">, now: Date) {
  switch (preset) {
    case "this-month":
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      };
    case "last-3-months":
      return {
        from: startOfMonth(subMonths(now, 2)),
        to: endOfMonth(now),
      };
    case "last-6-months":
      return {
        from: startOfMonth(subMonths(now, 5)),
        to: endOfMonth(now),
      };
    case "this-year":
      return {
        from: startOfYear(now),
        to: endOfMonth(now),
      };
  }
}

export function useDateRange() {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const defaultFrom = format(currentMonthStart, "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(today), "yyyy-MM-dd");

  const [params, setParams] = useQueryStates({
    from: parseAsString.withDefault(defaultFrom),
    to: parseAsString.withDefault(defaultTo),
    preset: parseAsString.withDefault("this-month"),
  });

  const preset = params.preset as DatePreset;
  const viewedMonthStart = startOfMonth(new Date(`${params.from}T00:00:00`));
  const viewedMonthLabel = isSameMonth(viewedMonthStart, currentMonthStart)
    ? format(viewedMonthStart, "MMMM")
    : format(viewedMonthStart, "MMM''yy");
  const canGoToNextMonth = viewedMonthStart < currentMonthStart;
  const analysisMode: DashboardAnalysisMode =
    preset === "custom"
      ? "custom-range"
      : preset === "this-month"
        ? "single-month"
        : "multi-month-preset";

  function setPreset(nextPreset: DatePreset) {
    if (nextPreset === "custom") {
      return;
    }

    const range = getPresetRange(nextPreset, new Date());
    setParams({
      from: format(range.from, "yyyy-MM-dd"),
      to: format(range.to, "yyyy-MM-dd"),
      preset: nextPreset,
    });
  }

  function setCustomRange(from: Date, to: Date) {
    setParams({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      preset: "custom",
    });
  }

  function goToPreviousMonth() {
    const previousMonth = subMonths(viewedMonthStart, 1);

    setParams({
      from: format(startOfMonth(previousMonth), "yyyy-MM-dd"),
      to: format(endOfMonth(previousMonth), "yyyy-MM-dd"),
      preset: "this-month",
    });
  }

  function goToNextMonth() {
    if (!canGoToNextMonth) {
      return;
    }

    const nextMonth = subMonths(viewedMonthStart, -1);

    setParams({
      from: format(startOfMonth(nextMonth), "yyyy-MM-dd"),
      to: format(endOfMonth(nextMonth), "yyyy-MM-dd"),
      preset: "this-month",
    });
  }

  return {
    from: params.from,
    to: params.to,
    preset,
    analysisMode,
    viewedMonthLabel,
    viewedMonthStart,
    canGoToNextMonth,
    setPreset,
    setCustomRange,
    goToPreviousMonth,
    goToNextMonth,
  };
}
