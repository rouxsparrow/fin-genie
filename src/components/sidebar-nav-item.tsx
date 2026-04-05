'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  label: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
  disabled: boolean;
}

export function SidebarNavItem({
  label,
  icon: Icon,
  href,
  active,
  disabled,
}: SidebarNavItemProps) {
  const baseClasses =
    'flex items-center gap-2 h-11 px-4 rounded-base text-sm font-medium transition-all';

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                baseClasses,
                'opacity-50 cursor-not-allowed'
              )}
              role="link"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
            >
              <Icon size={20} />
              <span>{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            Available in the next update
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (active) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          'bg-main text-foreground border-2 border-border shadow-shadow'
        )}
      >
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        baseClasses,
        'hover:bg-background'
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}
