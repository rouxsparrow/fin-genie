"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
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

export function DateRangeSelector() {
  const {
    from,
    to,
    preset,
    viewedMonthLabel,
    canGoToNextMonth,
    setPreset,
    setCustomRange,
    goToPreviousMonth,
    goToNextMonth,
  } = useDateRange();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  useEffect(() => {
    if (preset === "custom") {
      setCustomStart(parseISO(from));
      setCustomEnd(parseISO(to));
    }
  }, [from, to, preset]);

  function handlePresetClick(presetValue: DatePreset) {
    setPreset(presetValue);
  }

  function handleCustomStartSelect(date: Date | undefined) {
    if (!date) {
      return;
    }

    setCustomStart(date);

    if (customEnd && date <= customEnd) {
      setCustomRange(date, customEnd);
      setPopoverOpen(false);
    }
  }

  function handleCustomEndSelect(date: Date | undefined) {
    if (!date) {
      return;
    }

    setCustomEnd(date);

    if (customStart && date >= customStart) {
      setCustomRange(customStart, date);
      setPopoverOpen(false);
    }
  }

  const customLabel =
    preset === "custom"
      ? `${format(parseISO(from), "MMM d")} - ${format(parseISO(to), "MMM d")}`
      : "Custom";

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
          onClick={goToPreviousMonth}
          aria-label="Go to previous month"
          className="size-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={preset === "this-month" ? "default" : "neutral"}
          aria-pressed={preset === "this-month"}
          onClick={() => handlePresetClick("this-month")}
          className="min-w-[96px]"
        >
          {viewedMonthLabel}
        </Button>
        <Button
          size="icon"
          variant={preset === "this-month" ? "default" : "neutral"}
          onClick={goToNextMonth}
          disabled={!canGoToNextMonth}
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
          >
            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium opacity-60">Start date</span>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={handleCustomStartSelect}
                toDate={customEnd}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium opacity-60">End date</span>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={handleCustomEndSelect}
                fromDate={customStart}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
