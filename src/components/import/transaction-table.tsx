'use client';

import React from 'react';
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
  const canExpand =
    isUncategorizedSection &&
    !!categories &&
    !!onRuleCreated &&
    !!onCategoryCreated;

  return (
    <div>
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
              const isExpanded = openPopoverHash === tx.hash;
              const isClickable =
                isUncategorizedSection && !isDuplicate && canExpand;

              return (
                <React.Fragment key={tx.hash}>
                  <TableRow
                    className={cn(
                      'h-12',
                      index % 2 === 0
                        ? 'bg-secondary-background'
                        : 'bg-background',
                      isDuplicate && 'opacity-50 hover:bg-transparent',
                      isClickable && 'cursor-pointer hover:bg-background',
                      isExpanded && 'border-l-2 border-l-main bg-background',
                    )}
                    aria-disabled={isDuplicate || undefined}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-expanded={isClickable ? isExpanded : undefined}
                    onClick={
                      isClickable
                        ? () =>
                            onOpenPopover?.(isExpanded ? null : tx.hash)
                        : undefined
                    }
                    onKeyDown={
                      isClickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onOpenPopover?.(isExpanded ? null : tx.hash);
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
                  {isExpanded && canExpand && (
                    <TableRow className="bg-secondary-background">
                      <TableCell colSpan={4} className="p-4">
                        <RuleCreationPopover
                          description={tx.description}
                          categories={categories}
                          onRuleCreated={onRuleCreated}
                          onCategoryCreated={onCategoryCreated}
                          open={true}
                          onOpenChange={(open) =>
                            onOpenPopover?.(open ? tx.hash : null)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
          const isExpanded = openPopoverHash === tx.hash;
          const isClickable =
            isUncategorizedSection && !isDuplicate && canExpand;

          return (
            <div key={tx.hash}>
              <TransactionCard
                transaction={tx}
                isDuplicate={isDuplicate}
                categoryName={category?.name}
                isSystemCategory={category?.is_system}
                isUncategorized={isClickable}
                onTap={
                  isClickable
                    ? () =>
                        onOpenPopover?.(isExpanded ? null : tx.hash)
                    : undefined
                }
              />
              {isExpanded && canExpand && (
                <div className="rounded-b-base border-2 border-t-0 border-border bg-secondary-background p-4">
                  <RuleCreationPopover
                    description={tx.description}
                    categories={categories}
                    onRuleCreated={onRuleCreated}
                    onCategoryCreated={onCategoryCreated}
                    open={true}
                    onOpenChange={(open) =>
                      onOpenPopover?.(open ? tx.hash : null)
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
