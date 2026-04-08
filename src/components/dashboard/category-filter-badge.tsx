'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterBadgeProps {
  categoryName: string;
  onClear: () => void;
}

export function CategoryFilterBadge({
  categoryName,
  onClear,
}: CategoryFilterBadgeProps) {
  return (
    <Badge
      variant="default"
      aria-label={`Filtered by ${categoryName}. Press to remove filter.`}
      className="gap-1.5 py-1 px-3 text-sm"
    >
      Filtered: {categoryName}
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove category filter"
        className="inline-flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
