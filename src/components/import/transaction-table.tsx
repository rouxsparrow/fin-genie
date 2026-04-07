'use client';

import { useRef, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Lock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RuleCreationPopover } from '@/components/rules/rule-creation-popover';
import { TransactionCard } from '@/components/import/transaction-card';
import { cn } from '@/lib/utils';
import type { ParsedTransaction } from '@/lib/parser/types';
import type { Rule, Category } from '@/lib/types/database';

interface TransactionTableProps {
  transactions: ParsedTransaction[];
  duplicateHashes: Set<string>;
  section: 'categorized' | 'uncategorized';
  categoryMap?: Map<string, string>;
  categoryLookup?: Map<string, Category>;
  categories?: Category[];
  openPopoverHash?: string | null;
  onOpenPopover?: (hash: string | null) => void;
  onRuleCreated?: (rule: Rule) => void;
  onCategoryCreated?: (cat: Category) => void;
}

function formatCurrency(amountCents: number, isDebit: boolean): string {
  const formatted = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amountCents / 100);

  return isDebit ? formatted : `(${formatted})`;
}

/**
 * Floating popover panel that positions itself below a target row.
 * Rendered OUTSIDE the table to avoid invalid DOM nesting.
 */
function FloatingPopover({
  targetRef,
  transaction,
  categories,
  onRuleCreated,
  onCategoryCreated,
  open,
  onOpenChange,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  transaction: ParsedTransaction;
  categories: Category[];
  onRuleCreated: (rule: Rule) => void;
  onCategoryCreated: (cat: Category) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (open && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [open, targetRef]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        targetRef.current &&
        !targetRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    }
    // Use a timeout so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onOpenChange, targetRef]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute z-50 w-[calc(100vw-32px)] md:w-80 rounded-base border-2 border-border bg-secondary-background p-4 text-foreground shadow-shadow"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label={`Create categorization rule for ${transaction.description}`}
    >
      <RuleCreationPopover
        description={transaction.description}
        categories={categories}
        onRuleCreated={onRuleCreated}
        onCategoryCreated={onCategoryCreated}
        open={open}
        onOpenChange={onOpenChange}
      />
    </div>
  );
}

export function TransactionTable({
  transactions,
  duplicateHashes,
  section,
  categoryMap,
  categoryLookup,
  categories,
  openPopoverHash,
  onOpenPopover,
  onRuleCreated,
  onCategoryCreated,
}: TransactionTableProps) {
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

  if (transactions.length === 0) {
    return null;
  }

  const isUncategorizedSection = section === 'uncategorized';
  const canShowPopover =
    isUncategorizedSection &&
    !!categories &&
    !!onRuleCreated &&
    !!onCategoryCreated;

  // Find the active transaction for the popover
  const activeTransaction = openPopoverHash
    ? transactions.find((t) => t.hash === openPopoverHash)
    : null;

  return (
    <div className="relative">
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm font-bold">Date</TableHead>
              <TableHead className="text-sm font-bold">Description</TableHead>
              <TableHead className="text-right text-sm font-bold">
                Amount (SGD)
              </TableHead>
              <TableHead className="text-sm font-bold">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => {
              const isDuplicate = duplicateHashes.has(tx.hash);
              const categoryId = categoryMap?.get(tx.hash);
              const category = categoryId
                ? categoryLookup?.get(categoryId)
                : undefined;
              const isPopoverOpen = openPopoverHash === tx.hash;
              const isClickable =
                isUncategorizedSection && !isDuplicate && canShowPopover;

              return (
                <TableRow
                  key={tx.hash}
                  ref={(el) => {
                    if (el) rowRefs.current.set(tx.hash, el);
                    else rowRefs.current.delete(tx.hash);
                  }}
                  className={cn(
                    'h-12',
                    index % 2 === 0
                      ? 'bg-secondary-background'
                      : 'bg-background',
                    isDuplicate && 'opacity-50 hover:bg-transparent',
                    isClickable && 'cursor-pointer hover:bg-background',
                    isPopoverOpen && 'border-l-2 border-l-main bg-background',
                  )}
                  aria-disabled={isDuplicate || undefined}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  aria-haspopup={isClickable ? 'dialog' : undefined}
                  aria-expanded={isClickable ? isPopoverOpen : undefined}
                  onClick={
                    isClickable
                      ? () =>
                          onOpenPopover?.(isPopoverOpen ? null : tx.hash)
                      : undefined
                  }
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOpenPopover?.(isPopoverOpen ? null : tx.hash);
                          }
                        }
                      : undefined
                  }
                >
                  <TableCell
                    className={cn(
                      'text-sm font-medium',
                      isDuplicate && 'line-through',
                    )}
                  >
                    {format(parseISO(tx.date), 'd MMM yyyy')}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'max-w-[300px] truncate text-sm font-medium',
                      isDuplicate && 'line-through',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {isDuplicate && (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[#d97706]" />
                      )}
                      {tx.description}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-sm font-medium tabular-nums',
                      isDuplicate && 'line-through',
                    )}
                  >
                    {formatCurrency(tx.amountCents, tx.isDebit)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-sm font-medium',
                      isDuplicate && 'line-through',
                    )}
                  >
                    {category ? (
                      <Badge
                        variant={category.is_system ? 'neutral' : 'default'}
                      >
                        {category.is_system && (
                          <Lock className="h-3 w-3" />
                        )}
                        {category.name}
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium opacity-40">
                        --
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {transactions.map((tx) => {
          const isDuplicate = duplicateHashes.has(tx.hash);
          const categoryId = categoryMap?.get(tx.hash);
          const category = categoryId
            ? categoryLookup?.get(categoryId)
            : undefined;
          const isPopoverOpen = openPopoverHash === tx.hash;
          const isClickable =
            isUncategorizedSection && !isDuplicate && canShowPopover;

          return (
            <div
              key={tx.hash}
              ref={(el) => {
                if (el) rowRefs.current.set(tx.hash, el);
                else rowRefs.current.delete(tx.hash);
              }}
            >
              <TransactionCard
                transaction={tx}
                isDuplicate={isDuplicate}
                categoryName={category?.name}
                isSystemCategory={category?.is_system}
                isUncategorized={isClickable}
                onTap={
                  isClickable
                    ? () =>
                        onOpenPopover?.(isPopoverOpen ? null : tx.hash)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      {/* Floating popover — rendered OUTSIDE the table */}
      {canShowPopover && activeTransaction && openPopoverHash && (
        <FloatingPopover
          targetRef={{ current: rowRefs.current.get(openPopoverHash) ?? null }}
          transaction={activeTransaction}
          categories={categories}
          onRuleCreated={onRuleCreated}
          onCategoryCreated={onCategoryCreated}
          open={true}
          onOpenChange={(open) => onOpenPopover?.(open ? openPopoverHash : null)}
        />
      )}
    </div>
  );
}
