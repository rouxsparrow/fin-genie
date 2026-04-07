'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MatchType } from '@/lib/types/database';

interface MatchTypeBadgeProps {
  matchType: MatchType;
  className?: string;
}

export function MatchTypeBadge({ matchType, className }: MatchTypeBadgeProps) {
  return (
    <Badge
      variant="neutral"
      className={cn(matchType === 'regex' && 'font-mono', className)}
    >
      {matchType}
    </Badge>
  );
}
