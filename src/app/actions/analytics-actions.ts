'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Transaction } from '@/lib/types/database';
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  differenceInMonths,
} from 'date-fns';

// ---------- Types ----------

export type TransactionWithCategory = Transaction & {
  categories: {
    name: string;
    is_system: boolean;
    exclude_from_stats: boolean;
  } | null;
};

export type DashboardStats = {
  totalSpending: number; // cents
  previousMonthSpending: number | null; // cents, null if no data
  monthlyAverage: number | null; // cents
  topCategory: { name: string; amount: number } | null;
  largestTransaction: { description: string; amount: number } | null;
  recurringSpend: number; // cents (Subscriptions category total)
};

export type CategoryBreakdownItem = {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
};

export type MonthlyTrendItem = {
  month: string; // YYYY-MM
  label: string; // "Jan", "Feb", etc.
  amount: number; // cents
};

export type TransactionListResult = {
  transactions: TransactionWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ---------- Validation ----------

const dateRangeSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
});

const transactionListSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sortBy: z
    .enum(['transaction_date', 'amount_cents', 'description'])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

// ---------- Auth helper ----------

async function verifyAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false as const, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { authenticated: false as const, error: 'Profile not found' };
  }

  return { authenticated: true as const, profile, supabase };
}

// ---------- Helpers ----------

/**
 * Get IDs of all categories that should be excluded from spending analytics.
 * This includes system categories (e.g., Card Payment) and any user categories
 * with exclude_from_stats=true (e.g., Rebate, Refund).
 */
async function getExcludedCategoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .or('is_system.eq.true,exclude_from_stats.eq.true');

  return (data ?? []).map((c) => c.id);
}

/**
 * Apply exclusion filter to a Supabase query.
 * When excludedIds is non-empty, filters out transactions with those category IDs.
 */
function applyExclusionFilter<T>(
  query: T,
  excludedIds: string[]
): T {
  if (excludedIds.length === 0) return query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).not(
    'category_id',
    'in',
    `(${excludedIds.join(',')})`
  ) as T;
}

// ---------- Server Actions ----------

export async function fetchDashboardStats(
  from: string,
  to: string
): Promise<
  | { success: true; data: DashboardStats }
  | { success: false; error: string }
> {
  const parsed = dateRangeSchema.safeParse({ from, to });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const householdId = profile.household_id;

  // Get all excluded category IDs (system + user-excluded)
  const excludedIds = await getExcludedCategoryIds(supabase, householdId);

  // Fetch all debit transactions in range (excluding excluded categories)
  let query = supabase
    .from('transactions')
    .select('*, categories(name, is_system, exclude_from_stats)')
    .eq('household_id', householdId)
    .eq('is_debit', true)
    .gte('transaction_date', from)
    .lte('transaction_date', to);

  query = applyExclusionFilter(query, excludedIds);

  const { data: transactions, error } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch transactions.' };
  }

  const txs = (transactions ?? []) as TransactionWithCategory[];

  // Total spending
  const totalSpending = txs.reduce((sum, tx) => sum + tx.amount_cents, 0);

  // Previous month spending
  const fromDate = parseISO(from);
  const prevFrom = format(startOfMonth(subMonths(fromDate, 1)), 'yyyy-MM-dd');
  const prevTo = format(endOfMonth(subMonths(fromDate, 1)), 'yyyy-MM-dd');

  let prevQuery = supabase
    .from('transactions')
    .select('amount_cents')
    .eq('household_id', householdId)
    .eq('is_debit', true)
    .gte('transaction_date', prevFrom)
    .lte('transaction_date', prevTo);

  prevQuery = applyExclusionFilter(prevQuery, excludedIds);

  const { data: prevTxs } = await prevQuery;
  const previousMonthSpending =
    prevTxs && prevTxs.length > 0
      ? prevTxs.reduce(
          (sum, tx) => sum + (tx as { amount_cents: number }).amount_cents,
          0
        )
      : null;

  // Monthly average across all transactions
  let allQuery = supabase
    .from('transactions')
    .select('amount_cents, transaction_date')
    .eq('household_id', householdId)
    .eq('is_debit', true);

  allQuery = applyExclusionFilter(allQuery, excludedIds);

  const { data: allTxs } = await allQuery;

  let monthlyAverage: number | null = null;
  if (allTxs && allTxs.length > 0) {
    const months = new Set(
      allTxs.map((tx) => format(parseISO(tx.transaction_date), 'yyyy-MM'))
    );
    const totalAll = allTxs.reduce((sum, tx) => sum + tx.amount_cents, 0);
    monthlyAverage = Math.round(totalAll / months.size);
  }

  // Top category by amount
  const categoryTotals: Record<string, { name: string; amount: number }> = {};
  for (const tx of txs) {
    const catId = tx.category_id ?? 'uncategorized';
    const catName = tx.categories?.name ?? 'Uncategorized';
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { name: catName, amount: 0 };
    }
    categoryTotals[catId].amount += tx.amount_cents;
  }

  const sortedCategories = Object.values(categoryTotals).sort(
    (a, b) => b.amount - a.amount
  );
  const topCategory =
    sortedCategories.length > 0 ? sortedCategories[0] : null;

  // Largest transaction
  const largestTx =
    txs.length > 0
      ? txs.reduce((max, tx) =>
          tx.amount_cents > max.amount_cents ? tx : max
        )
      : null;
  const largestTransaction = largestTx
    ? { description: largestTx.description, amount: largestTx.amount_cents }
    : null;

  // Recurring spend (Subscriptions category)
  const subscriptionTxs = txs.filter(
    (tx) => tx.categories?.name === 'Subscriptions'
  );
  const recurringSpend = subscriptionTxs.reduce(
    (sum, tx) => sum + tx.amount_cents,
    0
  );

  return {
    success: true,
    data: {
      totalSpending,
      previousMonthSpending,
      monthlyAverage,
      topCategory,
      largestTransaction,
      recurringSpend,
    },
  };
}

export async function fetchCategoryBreakdown(
  from: string,
  to: string
): Promise<
  | { success: true; data: CategoryBreakdownItem[] }
  | { success: false; error: string }
> {
  const parsed = dateRangeSchema.safeParse({ from, to });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const householdId = profile.household_id;
  const excludedIds = await getExcludedCategoryIds(supabase, householdId);

  let query = supabase
    .from('transactions')
    .select('amount_cents, category_id, categories(name, is_system, exclude_from_stats)')
    .eq('household_id', householdId)
    .eq('is_debit', true)
    .gte('transaction_date', from)
    .lte('transaction_date', to);

  query = applyExclusionFilter(query, excludedIds);

  const { data: transactions, error } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch transactions.' };
  }

  const txs = (transactions ?? []) as Array<{
    amount_cents: number;
    category_id: string | null;
    categories: { name: string; is_system: boolean; exclude_from_stats: boolean } | null;
  }>;

  // Group by category
  const categoryTotals: Record<
    string,
    { categoryName: string; amount: number }
  > = {};

  for (const tx of txs) {
    const catId = tx.category_id ?? 'uncategorized';
    const catName = tx.categories?.name ?? 'Uncategorized';
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { categoryName: catName, amount: 0 };
    }
    categoryTotals[catId].amount += tx.amount_cents;
  }

  const totalAmount = Object.values(categoryTotals).reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const breakdown: CategoryBreakdownItem[] = Object.entries(categoryTotals)
    .map(([categoryId, { categoryName, amount }]) => ({
      categoryId,
      categoryName,
      amount,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { success: true, data: breakdown };
}

export async function fetchMonthlyTrend(
  from: string,
  to: string
): Promise<
  | { success: true; data: MonthlyTrendItem[] }
  | { success: false; error: string }
> {
  const parsed = dateRangeSchema.safeParse({ from, to });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const householdId = profile.household_id;
  const excludedIds = await getExcludedCategoryIds(supabase, householdId);

  let query = supabase
    .from('transactions')
    .select('amount_cents, transaction_date')
    .eq('household_id', householdId)
    .eq('is_debit', true)
    .gte('transaction_date', from)
    .lte('transaction_date', to);

  query = applyExclusionFilter(query, excludedIds);

  const { data: transactions, error } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch transactions.' };
  }

  const txs = (transactions ?? []) as Array<{
    amount_cents: number;
    transaction_date: string;
  }>;

  // Group by month
  const monthlyTotals: Record<string, number> = {};

  for (const tx of txs) {
    const month = format(parseISO(tx.transaction_date), 'yyyy-MM');
    monthlyTotals[month] = (monthlyTotals[month] ?? 0) + tx.amount_cents;
  }

  // Sort by month and create labels
  const trend: MonthlyTrendItem[] = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month,
      label: format(parseISO(`${month}-01`), 'MMM'),
      amount,
    }));

  return { success: true, data: trend };
}

export async function fetchRecentTransactions(
  from: string,
  to: string,
  limit: number = 10,
  categoryId?: string
): Promise<
  | {
      success: true;
      data: { transactions: TransactionWithCategory[]; total: number };
    }
  | { success: false; error: string }
> {
  const parsed = dateRangeSchema.safeParse({ from, to });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const householdId = profile.household_id;

  // Exclude system + user-excluded categories from recent transactions
  const excludedIds = await getExcludedCategoryIds(supabase, householdId);

  let query = supabase
    .from('transactions')
    .select('*, categories(name, is_system, exclude_from_stats)', { count: 'exact' })
    .eq('household_id', householdId)
    .eq('is_debit', true)
    .gte('transaction_date', from)
    .lte('transaction_date', to);

  query = applyExclusionFilter(query, excludedIds);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  query = query
    .order('transaction_date', { ascending: false })
    .limit(limit);

  const { data: transactions, count, error } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch recent transactions.' };
  }

  return {
    success: true,
    data: {
      transactions: (transactions ?? []) as TransactionWithCategory[],
      total: count ?? 0,
    },
  };
}

export async function fetchTransactionList(params: {
  from: string;
  to: string;
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<
  | { success: true; data: TransactionListResult }
  | { success: false; error: string }
> {
  const parsed = transactionListSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { from, to, page, pageSize, search, categoryId, sortBy, sortDir } =
    parsed.data;

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const householdId = profile.household_id;

  let query = supabase
    .from('transactions')
    .select('*, categories(name, is_system, exclude_from_stats)', { count: 'exact' })
    .eq('household_id', householdId)
    .gte('transaction_date', from)
    .lte('transaction_date', to);

  if (search) {
    query = query.ilike('description', `%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const sortColumn = sortBy ?? 'transaction_date';
  const ascending = sortDir === 'asc';
  query = query.order(sortColumn, { ascending });

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = page * pageSize - 1;
  query = query.range(rangeFrom, rangeTo);

  const { data: transactions, count, error } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch transactions.' };
  }

  const total = count ?? 0;

  return {
    success: true,
    data: {
      transactions: (transactions ?? []) as TransactionWithCategory[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
