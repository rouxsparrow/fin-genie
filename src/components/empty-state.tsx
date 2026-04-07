'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  ctaDisabledTooltip?: string;
  altText?: string;
}

export function EmptyState({
  icon,
  heading,
  body,
  ctaLabel,
  ctaHref,
  ctaDisabled,
  ctaDisabledTooltip,
  altText,
}: EmptyStateProps) {
  return (
    <div className="max-w-[480px] mx-auto">
      <Card>
        <CardContent className="p-8 text-center flex flex-col items-center">
          <div className="opacity-50">{icon}</div>
          <div className="h-4" />
          <h2 className="text-2xl font-bold">{heading}</h2>
          <div className="h-2" />
          <p className="text-base font-medium opacity-60">{body}</p>
          <div className="h-6" />
          {ctaLabel && !altText && (
            <>
              {ctaDisabled ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button disabled>{ctaLabel}</Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {ctaDisabledTooltip ?? 'Coming soon'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : ctaHref ? (
                <Button asChild>
                  <Link href={ctaHref}>{ctaLabel}</Link>
                </Button>
              ) : (
                <Button>{ctaLabel}</Button>
              )}
            </>
          )}
          {altText && (
            <p className="text-sm font-medium italic">{altText}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
