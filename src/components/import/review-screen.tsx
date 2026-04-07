'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { evaluateRules } from '@/lib/rules/evaluate-rules';
import { fetchCategories } from '@/app/actions/category-actions';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CollapsedDropZone } from '@/components/import/collapsed-drop-zone';
import { StatementSummary } from '@/components/import/statement-summary';
import { DuplicateWarning } from '@/components/import/duplicate-warning';
import { TransactionTable } from '@/components/import/transaction-table';
import { ImportBar } from '@/components/import/import-bar';
import { Badge } from '@/components/ui/badge';
import type { ParseResult } from '@/lib/parser/types';
import type { Rule, Category } from '@/lib/types/database';

interface ReviewScreenProps {
  parseResult: ParseResult;
  duplicateHashes: string[];
  fileName: string;
  onImport: () => void;
  onUploadAnother: () => void;
  isImporting: boolean;
  onCategoryMapChange?: (map: Record<string, string>) => void;
}

export function ReviewScreen({
  parseResult,
  duplicateHashes,
  fileName,
  onImport,
  onUploadAnother,
  isImporting,
  onCategoryMapChange,
}: ReviewScreenProps) {
  const duplicateSet = useMemo(
    () => new Set(duplicateHashes),
    [duplicateHashes],
  );

  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [openPopoverHash, setOpenPopoverHash] = useState<string | null>(null);

  // Load rules and categories on mount
  useEffect(() => {
    async function loadRulesAndCategories() {
      const supabase = createClient();
      const { data: rulesData } = await supabase
        .from('rules')
        .select('*')
        .order('sort_order', { ascending: true });
      if (rulesData) setRules(rulesData as Rule[]);

      const catResult = await fetchCategories();
      if (catResult.success) setCategories(catResult.categories as Category[]);
    }
    loadRulesAndCategories();
  }, []);

  // Re-evaluate rules whenever rules change
  useEffect(() => {
    const nonDuplicates = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash),
    );
    const newMap = evaluateRules(nonDuplicates, rules);
    setCategoryMap(newMap);
    onCategoryMapChange?.(Object.fromEntries(newMap));
  }, [rules, parseResult.transactions, duplicateSet, onCategoryMapChange]);

  const { categorizedTxns, uncategorizedTxns, duplicateTxns } = useMemo(() => {
    const categorized = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash) && categoryMap.has(t.hash),
    );
    const uncategorized = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash) && !categoryMap.has(t.hash),
    );
    const duplicates = parseResult.transactions.filter((t) =>
      duplicateSet.has(t.hash),
    );

    return {
      categorizedTxns: categorized,
      uncategorizedTxns: uncategorized,
      duplicateTxns: duplicates,
    };
  }, [parseResult.transactions, duplicateSet, categoryMap]);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) map.set(cat.id, cat);
    return map;
  }, [categories]);

  const handleRuleCreated = useCallback(
    (rule: Rule) => {
      setRules((prev) =>
        [...prev, rule].sort((a, b) => a.sort_order - b.sort_order),
      );
      setOpenPopoverHash(null);

      // Count how many transactions this new rule would categorize
      // (will be reflected after the useEffect re-evaluates)
      const nonDuplicates = parseResult.transactions.filter(
        (t) => !duplicateSet.has(t.hash) && !categoryMap.has(t.hash),
      );
      let matchCount = 0;
      for (const tx of nonDuplicates) {
        if (rule.match_type === 'regex') {
          try {
            if (new RegExp(rule.pattern, 'i').test(tx.description))
              matchCount++;
          } catch {
            /* invalid regex */
          }
        } else {
          if (
            tx.description
              .toLowerCase()
              .includes(rule.pattern.toLowerCase())
          )
            matchCount++;
        }
      }
      toast.success(
        `Rule created. ${matchCount} transaction${matchCount === 1 ? '' : 's'} categorized.`,
      );
    },
    [parseResult.transactions, duplicateSet, categoryMap],
  );

  const handleCategoryCreated = useCallback((cat: Category) => {
    setCategories((prev) =>
      [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  const { totalDebits, totalCredits } = useMemo(() => {
    const nonDuplicates = parseResult.transactions.filter(
      (t) => !duplicateSet.has(t.hash),
    );

    let debits = 0;
    let credits = 0;

    for (const t of nonDuplicates) {
      if (t.isDebit) {
        debits += t.amountCents;
      } else {
        credits += t.amountCents;
      }
    }

    return { totalDebits: debits, totalCredits: credits };
  }, [parseResult.transactions, duplicateSet]);

  return (
    <div className="flex flex-col gap-4">
      {/* Collapsed drop zone */}
      <CollapsedDropZone
        fileName={fileName}
        transactionCount={parseResult.transactions.length}
        onUploadAnother={onUploadAnother}
      />

      {/* Statement summary */}
      <StatementSummary
        periodStart={parseResult.statementPeriodStart}
        periodEnd={parseResult.statementPeriodEnd}
        totalTransactions={categorizedTxns.length + uncategorizedTxns.length}
        totalDebits={totalDebits}
        totalCredits={totalCredits}
      />

      {/* Duplicate warning */}
      {duplicateTxns.length > 0 && (
        <DuplicateWarning duplicateCount={duplicateTxns.length} />
      )}

      {/* Categorized section */}
      <div className="flex items-center gap-4 border-l-4 border-l-[#16a34a] pl-4">
        <h2 className="text-2xl font-bold">Categorized</h2>
        <Badge>{categorizedTxns.length} transactions</Badge>
      </div>
      {categorizedTxns.length === 0 ? (
        <p className="pl-8 text-sm font-medium opacity-40">
          No categorization rules configured yet
        </p>
      ) : (
        <TransactionTable
          transactions={categorizedTxns}
          duplicateHashes={duplicateSet}
          section="categorized"
          categoryMap={categoryMap}
          categoryLookup={categoryLookup}
          categories={categories}
        />
      )}

      {/* Uncategorized section */}
      <div className="flex items-center gap-4 border-l-4 border-l-[#d97706] pl-4">
        <h2 className="text-2xl font-bold">Uncategorized</h2>
        <Badge variant="neutral">
          {uncategorizedTxns.length} transactions
        </Badge>
      </div>
      {uncategorizedTxns.length > 0 && (
        <TransactionTable
          transactions={uncategorizedTxns}
          duplicateHashes={duplicateSet}
          section="uncategorized"
          categoryMap={categoryMap}
          categoryLookup={categoryLookup}
          categories={categories}
          openPopoverHash={openPopoverHash}
          onOpenPopover={setOpenPopoverHash}
          onRuleCreated={handleRuleCreated}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      {/* Duplicate section (show in uncategorized table with strikethrough) */}
      {duplicateTxns.length > 0 && (
        <TransactionTable
          transactions={duplicateTxns}
          duplicateHashes={duplicateSet}
          section="uncategorized"
        />
      )}

      {/* Import bar */}
      <ImportBar
        categorizedCount={categorizedTxns.length}
        totalCount={categorizedTxns.length + uncategorizedTxns.length}
        allCategorized={uncategorizedTxns.length === 0}
        onImport={onImport}
        isImporting={isImporting}
      />
    </div>
  );
}
