'use client';

// Stub: full implementation in Task 2
interface TimelineBarProps {
  imports: Array<{
    statement_period_start: string | null;
    statement_period_end: string | null;
    transaction_count: number;
  }>;
}

export function TimelineBar({ imports }: TimelineBarProps) {
  return (
    <div className="bg-secondary-background border-2 border-border rounded-base p-4">
      <h3 className="text-sm font-bold">Statement Coverage</h3>
      <div className="h-2" />
      <div className="text-sm opacity-40">
        Loading timeline for {imports.length} imports...
      </div>
    </div>
  );
}
