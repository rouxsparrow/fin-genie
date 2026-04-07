'use client';

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
import {
  Popover,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  if (transactions.length === 0) {
    return null;
  }

  const isUncategorizedSection = section === 'uncategorized';

  return (
    <>
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

              const rowContent = (
                <TableRow
                  key={tx.hash}
                  className={cn(
                    'h-12',
                    index % 2 === 0
                      ? 'bg-secondary-background'
                      : 'bg-background',
                    isDuplicate && 'opacity-50 hover:bg-transparent',
                    isUncategorizedSection &&
                      !isDuplicate &&
                      'cursor-pointer hover:bg-background',
                    isPopoverOpen && 'border-l-2 border-l-main',
                  )}
                  aria-disabled={isDuplicate || undefined}
                  role={
                    isUncategorizedSection && !isDuplicate
                      ? 'button'
                      : undefined
                  }
                  tabIndex={
                    isUncategorizedSection && !isDuplicate ? 0 : undefined
                  }
                  aria-haspopup={
                    isUncategorizedSection && !isDuplicate
                      ? 'dialog'
                      : undefined
                  }
                  aria-expanded={
                    isUncategorizedSection && !isDuplicate
                      ? isPopoverOpen
                      : undefined
                  }
                  onClick={
                    isUncategorizedSection && !isDuplicate
                      ? () => onOpenPopover?.(tx.hash)
                      : undefined
                  }
                  onKeyDown={
                    isUncategorizedSection && !isDuplicate
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOpenPopover?.(tx.hash);
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
                        variant={
                          category.is_system ? 'neutral' : 'default'
                        }
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

              // Wrap uncategorized rows with Popover
              if (
                isUncategorizedSection &&
                !isDuplicate &&
                categories &&
                onRuleCreated &&
                onCategoryCreated
              ) {
                return (
                  <Popover
                    key={tx.hash}
                    open={isPopoverOpen}
                    onOpenChange={(open: boolean) =>
                      onOpenPopover?.(open ? tx.hash : null)
                    }
                  >
                    <PopoverTrigger asChild>{rowContent}</PopoverTrigger>
                    <RuleCreationPopover
                      description={tx.description}
                      categories={categories}
                      onRuleCreated={onRuleCreated}
                      onCategoryCreated={onCategoryCreated}
                      open={isPopoverOpen}
                      onOpenChange={(open) =>
                        onOpenPopover?.(open ? tx.hash : null)
                      }
                    />
                  </Popover>
                );
              }

              return rowContent;
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

          const card = (
            <TransactionCard
              key={tx.hash}
              transaction={tx}
              isDuplicate={isDuplicate}
              categoryName={category?.name}
              isSystemCategory={category?.is_system}
              isUncategorized={isUncategorizedSection && !isDuplicate}
              onTap={
                isUncategorizedSection && !isDuplicate
                  ? () => onOpenPopover?.(tx.hash)
                  : undefined
              }
            />
          );

          // Wrap uncategorized cards with Popover
          if (
            isUncategorizedSection &&
            !isDuplicate &&
            categories &&
            onRuleCreated &&
            onCategoryCreated
          ) {
            return (
              <Popover
                key={tx.hash}
                open={isPopoverOpen}
                onOpenChange={(open: boolean) =>
                  onOpenPopover?.(open ? tx.hash : null)
                }
              >
                <PopoverTrigger asChild>{card}</PopoverTrigger>
                <RuleCreationPopover
                  description={tx.description}
                  categories={categories}
                  onRuleCreated={onRuleCreated}
                  onCategoryCreated={onCategoryCreated}
                  open={isPopoverOpen}
                  onOpenChange={(open) =>
                    onOpenPopover?.(open ? tx.hash : null)
                  }
                />
              </Popover>
            );
          }

          return card;
        })}
      </div>
    </>
  );
}
