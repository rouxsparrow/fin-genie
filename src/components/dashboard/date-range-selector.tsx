"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { format, parseISO, setMonth, setYear } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDateRange, type DatePreset } from "@/lib/hooks/use-date-range";

const presets: { value: DatePreset; label: string }[] = [
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "last-6-months", label: "Last 6 Months" },
  { value: "this-year", label: "This Year" },
];

const monthOptions = Array.from({ length: 12 }).map((_, index) => ({
  value: index,
  label: format(setMonth(new Date(), index), "MMM"),
}));

interface DateRangeSelectorProps {
  loading?: boolean;
}

type PendingAction =
  | "previous-month"
  | "next-month"
  | "viewed-month"
  | DatePreset
  | "custom"
  | null;

export function DateRangeSelector({
  loading = false,
}: DateRangeSelectorProps = {}) {
  const {
    from,
    to,
    preset,
    viewedMonthLabel,
    viewedMonthStart,
    canGoToNextMonth,
    setPreset,
    setCustomRange,
    setViewedMonth,
    goToPreviousMonth,
    goToNextMonth,
  } = useDateRange();
  const currentYear = new Date().getFullYear();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [customRange, setCustomRangeState] = useState<DateRange | undefined>();
  const viewedMonthYear = viewedMonthStart.getFullYear();
  const [pickerYear, setPickerYear] = useState(viewedMonthYear);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    if (preset === "custom") {
      setCustomRangeState({
        from: parseISO(from),
        to: parseISO(to),
      });
    }
  }, [from, to, preset]);

  useEffect(() => {
    setPickerYear(viewedMonthYear);
  }, [viewedMonthYear]);

  useEffect(() => {
    if (!loading) {
      setPendingAction(null);
    }
  }, [loading]);

  function handlePresetClick(presetValue: DatePreset) {
    setPendingAction(presetValue);
    setPreset(presetValue);
  }

  function handleCustomRangeSelect(range: DateRange | undefined) {
    setCustomRangeState(range);

    if (range?.from && range.to) {
      setPendingAction("custom");
      setCustomRange(range.from, range.to);
      setPopoverOpen(false);
    }
  }

  function handleCustomRangeReset() {
    setCustomRangeState(undefined);
  }

  function handleMonthSelect(date: Date | undefined) {
    if (!date) {
      return;
    }

    setPendingAction("viewed-month");
    setViewedMonth(date);
    setMonthPickerOpen(false);
  }

  const earliestYear = Math.min(
    currentYear - 5,
    viewedMonthStart.getFullYear(),
  );

  const customLabel =
    preset === "custom"
      ? `${format(parseISO(from), "MMM d")} - ${format(parseISO(to), "MMM d")}`
      : "Custom";

  function getLoadingText(label: ReactNode) {
    return (
      <>
        <span className="sr-only">Loading</span>
        <span>{label}</span>
      </>
    );
  }

  return (
    <div
      role="group"
      aria-label="Date range presets"
      className="flex flex-wrap items-center gap-2"
    >
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant={preset === "this-month" ? "default" : "neutral"}
          onClick={() => {
            setPendingAction("previous-month");
            goToPreviousMonth();
          }}
          loading={loading && pendingAction === "previous-month"}
          aria-label="Go to previous month"
          className="size-9"
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant={preset === "this-month" ? "default" : "neutral"}
              aria-pressed={preset === "this-month"}
              className="min-w-[96px]"
              loading={loading && pendingAction === "viewed-month"}
              loadingText={getLoadingText(viewedMonthLabel)}
              disabled={loading}
            >
              {viewedMonthLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4" align="center">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium opacity-60">Pick month</span>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="neutral"
                  onClick={() =>
                    setPickerYear((year) => Math.max(earliestYear, year - 1))
                  }
                  disabled={pickerYear <= earliestYear}
                  aria-label="Previous year"
                  className="size-9"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[88px] text-center text-lg font-bold tabular-nums">
                  {pickerYear}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="neutral"
                  onClick={() =>
                    setPickerYear((year) => Math.min(currentYear, year + 1))
                  }
                  disabled={pickerYear >= currentYear}
                  aria-label="Next year"
                  className="size-9"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {monthOptions.map((month) => {
                  const monthDate = setMonth(
                    setYear(new Date(), pickerYear),
                    month.value,
                  );
                  const disabled = monthDate > new Date();
                  const isActive =
                    viewedMonthStart.getFullYear() === pickerYear &&
                    viewedMonthStart.getMonth() === month.value;

                  return (
                    <Button
                      key={month.value}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "neutral"}
                      disabled={disabled}
                      onClick={() => handleMonthSelect(monthDate)}
                      className="w-full"
                    >
                      {month.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          size="icon"
          variant={preset === "this-month" ? "default" : "neutral"}
          onClick={() => {
            setPendingAction("next-month");
            goToNextMonth();
          }}
          loading={loading && pendingAction === "next-month"}
          disabled={loading || !canGoToNextMonth}
          aria-disabled={!canGoToNextMonth}
          aria-label="Go to next month"
          className="size-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {presets.map((item) => (
        <Button
          key={item.value}
          size="sm"
          variant={preset === item.value ? "default" : "neutral"}
          aria-pressed={preset === item.value}
          onClick={() => handlePresetClick(item.value)}
          loading={loading && pendingAction === item.value}
          loadingText={getLoadingText(item.label)}
          disabled={loading}
        >
          {item.label}
        </Button>
      ))}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={preset === "custom" ? "default" : "neutral"}
            aria-pressed={preset === "custom"}
            className="min-w-[160px]"
            loading={loading && pendingAction === "custom"}
            loadingText={getLoadingText(customLabel)}
            disabled={loading}
          >
            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium opacity-60">
                Select range
              </span>
              <Button
                type="button"
                size="sm"
                variant="neutral"
                onClick={handleCustomRangeReset}
                disabled={!customRange?.from && !customRange?.to}
              >
                Reset
              </Button>
            </div>
            <Calendar
              mode="range"
              min={1}
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={handleCustomRangeSelect}
              numberOfMonths={2}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
