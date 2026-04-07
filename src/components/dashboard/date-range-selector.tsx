'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDateRange, type DatePreset } from '@/lib/hooks/use-date-range';

const presets: { value: DatePreset; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
];

export function DateRangeSelector() {
  const { from, to, preset, setPreset, setCustomRange } = useDateRange();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  function handlePresetClick(presetValue: DatePreset) {
    setPreset(presetValue);
  }

  function handleCustomStartSelect(date: Date | undefined) {
    if (!date) return;
    setCustomStart(date);
    if (customEnd && date <= customEnd) {
      setCustomRange(date, customEnd);
      setPopoverOpen(false);
    }
  }

  function handleCustomEndSelect(date: Date | undefined) {
    if (!date) return;
    setCustomEnd(date);
    if (customStart && date >= customStart) {
      setCustomRange(customStart, date);
      setPopoverOpen(false);
    }
  }

  // Format the custom button label
  const customLabel =
    preset === 'custom'
      ? `${format(parseISO(from), 'MMM d')} - ${format(parseISO(to), 'MMM d')}`
      : 'Custom';

  return (
    <div
      role="group"
      aria-label="Date range presets"
      className="flex flex-wrap gap-2"
    >
      {presets.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={preset === p.value ? 'default' : 'neutral'}
          aria-pressed={preset === p.value}
          onClick={() => handlePresetClick(p.value)}
        >
          {p.label}
        </Button>
      ))}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={preset === 'custom' ? 'default' : 'neutral'}
            aria-pressed={preset === 'custom'}
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
