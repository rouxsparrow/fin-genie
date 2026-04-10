"use server";

import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type TransactionWithCategory = Transaction & {
  categories: {
    name: string;
    is_system: boolean;
    exclude_from_stats: boolean;
  } | null;
};

export type DashboardStats = {
  totalSpending: number;
  previousPeriodSpending: number | null;
  previousPeriodChange: number | null;
  sameMonthAverage: number | null;
  sameMonthAverageChange: number | null;
  sameMonthAverageLabel: string;
  topCategory: {
    categoryId: string;
    name: string;
    amount: number;
    percentage: number;
  } | null;
  largestTransaction: {
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
  } | null;
  recurringSpend: {
    total: number;
    averagePerMonth: number | null;
  };
  averageMonthlyAmount: number | null;
  highestMonth: { label: string; amount: number } | null;
  lowestMonth: { label: string; amount: number } | null;
  topCategories: Array<{
    categoryId: string;
    name: string;
    amount: number;
    percentage: number;
  }>;
  avgPerDay: number | null;
  totalDays: number;
};

export type CategoryBreakdownItem = {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
};

export type TimeSeriesBucket = "day" | "week" | "month";

export type MonthlyTrendItem = {
  key: string;
  label: string;
  amount: number;
  bucket: TimeSeriesBucket;
  periodStart: string;
  periodEnd: string;
};

export type CategoryTrendItem = {
  categoryId: string;
  categoryName: string;
  currentAmount: number;
  previousAmount: number;
  deltaPercent: number | null;
  direction: "up" | "down" | "flat";
};

export type CategoryComparisonSeries = {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
  }>;
  series: Record<
    string,
    Array<{
      key: string;
      label: string;
      amount: number;
    }>
  >;
};

export type TransactionListResult = {
  transactions: TransactionWithCategory[];
  total: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const dateRangeSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
});

const trendSchema = dateRangeSchema.extend({
  bucket: z.enum(["auto", "day", "week", "month"]).default("month"),
});

const transactionListSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sortBy: z
    .enum(["transaction_date", "amount_cents", "description"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  spendingOnly: z.boolean().optional(),
  excludeExcludedCategories: z.boolean().optional(),
});

const drilldownSchema = z.object({
  type: z.enum(["top-category", "largest-transactions", "subscriptions"]),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  categoryId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

async function verifyAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false as const, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { authenticated: false as const, error: "Profile not found" };
  }

  return { authenticated: true as const, profile, supabase };
}

async function getExcludedCategoryIds(
  supabase: SupabaseClient,
  householdId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("household_id", householdId)
    .or("is_system.eq.true,exclude_from_stats.eq.true");

  return (data ?? []).map((category) => category.id);
}

function applyExclusionFilter<T>(query: T, excludedIds: string[]): T {
  if (excludedIds.length === 0) {
    return query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).not(
    "category_id",
    "in",
    `(${excludedIds.join(",")})`,
  ) as T;
}

function isWholeMonthRange(fromDate: Date, toDate: Date) {
  return (
    isSameDay(fromDate, startOfMonth(fromDate)) &&
    isSameDay(toDate, endOfMonth(toDate))
  );
}

function buildEquivalentPeriodRange(fromDate: Date, toDate: Date) {
  if (isWholeMonthRange(fromDate, toDate)) {
    const monthSpan = differenceInCalendarMonths(toDate, fromDate) + 1;
    const previousFrom = startOfMonth(subMonths(fromDate, monthSpan));
    const previousTo = endOfMonth(subMonths(toDate, monthSpan));

    return {
      from: format(previousFrom, "yyyy-MM-dd"),
      to: format(previousTo, "yyyy-MM-dd"),
    };
  }

  const totalDays = differenceInCalendarDays(toDate, fromDate) + 1;
  const previousTo = subDays(fromDate, 1);
  const previousFrom = subDays(previousTo, totalDays - 1);

  return {
    from: format(previousFrom, "yyyy-MM-dd"),
    to: format(previousTo, "yyyy-MM-dd"),
  };
}

function getBucketType(fromDate: Date, toDate: Date): TimeSeriesBucket {
  const totalDays = differenceInCalendarDays(toDate, fromDate) + 1;

  if (totalDays <= 45) {
    return "day";
  }

  if (totalDays <= 120) {
    return "week";
  }

  return "month";
}

function getPercentChange(current: number, previous: number | null) {
  if (previous === null || previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function sumAmounts<T extends { amount_cents: number }>(items: T[]) {
  return items.reduce((sum, item) => sum + item.amount_cents, 0);
}

function buildCategoryBreakdown(transactions: TransactionWithCategory[]) {
  const totals = new Map<string, CategoryBreakdownItem>();

  for (const transaction of transactions) {
    const categoryId = transaction.category_id ?? "uncategorized";
    const categoryName = transaction.categories?.name ?? "Uncategorized";
    const current = totals.get(categoryId);

    if (current) {
      current.amount += transaction.amount_cents;
      continue;
    }

    totals.set(categoryId, {
      categoryId,
      categoryName,
      amount: transaction.amount_cents,
      percentage: 0,
    });
  }

  const items = [...totals.values()].sort((a, b) => b.amount - a.amount);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return items.map((item) => ({
    ...item,
    percentage:
      totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0,
  }));
}

function buildMonthlyTotals(transactions: TransactionWithCategory[]) {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    const monthKey = format(parseISO(transaction.transaction_date), "yyyy-MM");
    totals.set(
      monthKey,
      (totals.get(monthKey) ?? 0) + transaction.amount_cents,
    );
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, amount]) => ({
      month,
      label: format(parseISO(`${month}-01`), "MMM"),
      amount,
    }));
}

function buildYearToDateAverage(
  transactions: TransactionWithCategory[],
  selectedDate: Date,
) {
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  if (selectedMonth === 0) {
    return null;
  }

  let total = 0;

  for (let monthIndex = 0; monthIndex < selectedMonth; monthIndex += 1) {
    const monthStart = startOfMonth(
      setMonth(setYear(new Date(), selectedYear), monthIndex),
    );
    const monthKey = format(monthStart, "yyyy-MM");
    const monthTotal = transactions
      .filter(
        (transaction) =>
          format(parseISO(transaction.transaction_date), "yyyy-MM") ===
          monthKey,
      )
      .reduce((sum, transaction) => sum + transaction.amount_cents, 0);

    total += monthTotal;
  }

  return Math.round(total / selectedMonth);
}

function enumerateMonths(fromDate: Date, toDate: Date) {
  const months: Date[] = [];
  let cursor = startOfMonth(fromDate);
  const end = startOfMonth(toDate);

  while (cursor <= end) {
    months.push(cursor);
    cursor = startOfMonth(subMonths(cursor, -1));
  }

  return months;
}

function fetchSpendingTransactions(
  supabase: SupabaseClient,
  householdId: string,
  from: string,
  to: string,
  excludedIds: string[],
  options?: {
    categoryId?: string;
    search?: string;
    sortBy?: "transaction_date" | "amount_cents" | "description";
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
    count?: "exact";
    limit?: number;
  },
) {
  let query = supabase
    .from("transactions")
    .select("*, categories(name, is_system, exclude_from_stats)", {
      count: options?.count,
    })
    .eq("household_id", householdId)
    .eq("is_debit", true)
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  query = applyExclusionFilter(query, excludedIds);

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.search) {
    query = query.ilike("description", `%${options.search}%`);
  }

  if (options?.sortBy) {
    query = query.order(options.sortBy, {
      ascending: options.sortDir === "asc",
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (
    typeof options?.page === "number" &&
    typeof options?.pageSize === "number"
  ) {
    const rangeFrom = (options.page - 1) * options.pageSize;
    const rangeTo = rangeFrom + options.pageSize - 1;
    query = query.range(rangeFrom, rangeTo);
  }

  return query;
}

export async function fetchDashboardStats(
  from: string,
  to: string,
): Promise<
  { success: true; data: DashboardStats } | { success: false; error: string }
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
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const comparisonRange = buildEquivalentPeriodRange(fromDate, toDate);
  const yearStart = format(startOfYear(fromDate), "yyyy-MM-dd");
  const priorMonthEnd =
    fromDate.getMonth() === 0
      ? null
      : format(endOfMonth(subMonths(fromDate, 1)), "yyyy-MM-dd");

  const [
    { data: currentTransactions },
    { data: comparisonTransactions },
    previousMonthsResult,
  ] = await Promise.all([
    fetchSpendingTransactions(supabase, householdId, from, to, excludedIds),
    fetchSpendingTransactions(
      supabase,
      householdId,
      comparisonRange.from,
      comparisonRange.to,
      excludedIds,
    ),
    priorMonthEnd
      ? fetchSpendingTransactions(
          supabase,
          householdId,
          yearStart,
          priorMonthEnd,
          excludedIds,
        )
      : Promise.resolve({ data: [] }),
  ]);

  const current = (currentTransactions ?? []) as TransactionWithCategory[];
  const comparison = (comparisonTransactions ??
    []) as TransactionWithCategory[];
  const previousMonths = ((previousMonthsResult?.data as
    | TransactionWithCategory[]
    | undefined) ?? []) as TransactionWithCategory[];

  const totalSpending = sumAmounts(current);
  const previousPeriodSpending =
    comparison.length > 0 ? sumAmounts(comparison) : null;
  const previousPeriodChange = getPercentChange(
    totalSpending,
    previousPeriodSpending,
  );

  const sameMonthAverage = buildYearToDateAverage(previousMonths, fromDate);
  const sameMonthAverageChange = getPercentChange(
    totalSpending,
    sameMonthAverage,
  );

  const breakdown = buildCategoryBreakdown(current);
  const topCategory =
    breakdown.length > 0
      ? {
          categoryId: breakdown[0].categoryId,
          name: breakdown[0].categoryName,
          amount: breakdown[0].amount,
          percentage: breakdown[0].percentage,
        }
      : null;

  const largestTransaction =
    current.length > 0
      ? current
          .slice()
          .sort((left, right) => right.amount_cents - left.amount_cents)[0]
      : null;

  const monthlyTotals = buildMonthlyTotals(current);
  const averageMonthlyAmount =
    monthlyTotals.length > 0
      ? Math.round(
          monthlyTotals.reduce((sum, item) => sum + item.amount, 0) /
            monthlyTotals.length,
        )
      : null;

  const highestMonth =
    monthlyTotals.length > 0
      ? monthlyTotals.reduce((max, item) =>
          item.amount > max.amount ? item : max,
        )
      : null;
  const lowestMonth =
    monthlyTotals.length > 0
      ? monthlyTotals.reduce((min, item) =>
          item.amount < min.amount ? item : min,
        )
      : null;

  const subscriptionTransactions = current.filter(
    (transaction) => transaction.categories?.name === "Subscriptions",
  );
  const recurringTotal = sumAmounts(subscriptionTransactions);
  const totalMonths = Math.max(
    1,
    differenceInCalendarMonths(endOfMonth(toDate), startOfMonth(fromDate)) + 1,
  );
  const totalDays = differenceInCalendarDays(toDate, fromDate) + 1;

  return {
    success: true,
    data: {
      totalSpending,
      previousPeriodSpending,
      previousPeriodChange,
      sameMonthAverage,
      sameMonthAverageChange,
      sameMonthAverageLabel: "year-to-date average",
      topCategory,
      largestTransaction: largestTransaction
        ? {
            id: largestTransaction.id,
            description: largestTransaction.description,
            amount: largestTransaction.amount_cents,
            transactionDate: largestTransaction.transaction_date,
          }
        : null,
      recurringSpend: {
        total: recurringTotal,
        averagePerMonth:
          recurringTotal > 0 ? Math.round(recurringTotal / totalMonths) : null,
      },
      averageMonthlyAmount,
      highestMonth: highestMonth
        ? {
            label: format(parseISO(`${highestMonth.month}-01`), "MMM yyyy"),
            amount: highestMonth.amount,
          }
        : null,
      lowestMonth: lowestMonth
        ? {
            label: format(parseISO(`${lowestMonth.month}-01`), "MMM yyyy"),
            amount: lowestMonth.amount,
          }
        : null,
      topCategories: breakdown.slice(0, 3).map((item) => ({
        categoryId: item.categoryId,
        name: item.categoryName,
        amount: item.amount,
        percentage: item.percentage,
      })),
      avgPerDay: totalDays > 0 ? Math.round(totalSpending / totalDays) : null,
      totalDays,
    },
  };
}

export async function fetchCategoryBreakdown(
  from: string,
  to: string,
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
  const excludedIds = await getExcludedCategoryIds(
    supabase,
    profile.household_id,
  );
  const { data, error } = await fetchSpendingTransactions(
    supabase,
    profile.household_id,
    from,
    to,
    excludedIds,
  );

  if (error) {
    return { success: false, error: "Failed to fetch transactions." };
  }

  return {
    success: true,
    data: buildCategoryBreakdown((data ?? []) as TransactionWithCategory[]),
  };
}

export async function fetchMonthlyTrend(
  from: string,
  to: string,
  bucket: "auto" | TimeSeriesBucket = "month",
): Promise<
  | { success: true; data: MonthlyTrendItem[] }
  | { success: false; error: string }
> {
  const parsed = trendSchema.safeParse({ from, to, bucket });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const excludedIds = await getExcludedCategoryIds(
    supabase,
    profile.household_id,
  );
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const resolvedBucket =
    bucket === "auto" ? getBucketType(fromDate, toDate) : bucket;

  const { data, error } = await fetchSpendingTransactions(
    supabase,
    profile.household_id,
    from,
    to,
    excludedIds,
  );

  if (error) {
    return { success: false, error: "Failed to fetch transactions." };
  }

  const groups = new Map<
    string,
    {
      amount: number;
      periodStart: Date;
      periodEnd: Date;
    }
  >();

  for (const transaction of (data ?? []) as TransactionWithCategory[]) {
    const transactionDate = parseISO(transaction.transaction_date);
    const periodStart =
      resolvedBucket === "day"
        ? startOfDay(transactionDate)
        : resolvedBucket === "week"
          ? startOfWeek(transactionDate, { weekStartsOn: 1 })
          : startOfMonth(transactionDate);
    const periodEnd =
      resolvedBucket === "day"
        ? periodStart
        : resolvedBucket === "week"
          ? endOfWeek(transactionDate, { weekStartsOn: 1 })
          : endOfMonth(transactionDate);
    const key = format(
      periodStart,
      resolvedBucket === "month" ? "yyyy-MM" : "yyyy-MM-dd",
    );

    const current = groups.get(key);
    if (current) {
      current.amount += transaction.amount_cents;
      continue;
    }

    groups.set(key, {
      amount: transaction.amount_cents,
      periodStart,
      periodEnd,
    });
  }

  const items = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({
      key,
      label:
        resolvedBucket === "day"
          ? format(value.periodStart, "d MMM")
          : resolvedBucket === "week"
            ? `${format(value.periodStart, "d MMM")} - ${format(value.periodEnd, "d MMM")}`
            : format(value.periodStart, "MMM"),
      amount: value.amount,
      bucket: resolvedBucket,
      periodStart: format(value.periodStart, "yyyy-MM-dd"),
      periodEnd: format(value.periodEnd, "yyyy-MM-dd"),
    }));

  return { success: true, data: items };
}

export async function fetchCategoryTrends(
  from: string,
  to: string,
): Promise<
  | { success: true; data: CategoryTrendItem[] }
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
  const excludedIds = await getExcludedCategoryIds(
    supabase,
    profile.household_id,
  );
  const fromDate = parseISO(from);
  const previousMonthFrom = format(
    startOfMonth(subMonths(fromDate, 1)),
    "yyyy-MM-dd",
  );
  const previousMonthTo = format(
    endOfMonth(subMonths(fromDate, 1)),
    "yyyy-MM-dd",
  );

  const [{ data: currentData }, { data: previousData }] = await Promise.all([
    fetchSpendingTransactions(
      supabase,
      profile.household_id,
      from,
      to,
      excludedIds,
    ),
    fetchSpendingTransactions(
      supabase,
      profile.household_id,
      previousMonthFrom,
      previousMonthTo,
      excludedIds,
    ),
  ]);

  const current = buildCategoryBreakdown(
    (currentData ?? []) as TransactionWithCategory[],
  );
  const previous = buildCategoryBreakdown(
    (previousData ?? []) as TransactionWithCategory[],
  );
  const previousMap = new Map(
    previous.map((item) => [item.categoryId, item.amount]),
  );

  const trends = current.map<CategoryTrendItem>((item) => {
    const previousAmount = previousMap.get(item.categoryId) ?? 0;
    const deltaPercent =
      ((item.amount - previousAmount) / previousAmount) * 100;

    return {
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      currentAmount: item.amount,
      previousAmount,
      deltaPercent,
      direction: deltaPercent === 0 ? "flat" : deltaPercent > 0 ? "up" : "down",
    };
  });

  const filteredTrends = trends.filter((trend) => trend.previousAmount > 0);

  filteredTrends.sort((left, right) => {
    const leftMagnitude = Math.abs(left.deltaPercent ?? 0);
    const rightMagnitude = Math.abs(right.deltaPercent ?? 0);
    return rightMagnitude - leftMagnitude;
  });

  return { success: true, data: filteredTrends };
}

export async function fetchCategoryComparisonSeries(
  from: string,
  to: string,
): Promise<
  | { success: true; data: CategoryComparisonSeries }
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
  const excludedIds = await getExcludedCategoryIds(
    supabase,
    profile.household_id,
  );

  const { data, error } = await fetchSpendingTransactions(
    supabase,
    profile.household_id,
    from,
    to,
    excludedIds,
  );

  if (error) {
    return { success: false, error: "Failed to fetch category comparison." };
  }

  const transactions = (data ?? []) as TransactionWithCategory[];
  const months = enumerateMonths(parseISO(from), parseISO(to));
  const baseSeries = months.map((monthDate) => ({
    key: format(monthDate, "yyyy-MM"),
    label: format(monthDate, "MMM"),
    amount: 0,
  }));

  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      totalAmount: number;
      points: Array<{
        key: string;
        label: string;
        amount: number;
      }>;
    }
  >();

  for (const transaction of transactions) {
    const categoryId = transaction.category_id ?? "uncategorized";
    const categoryName = transaction.categories?.name ?? "Uncategorized";
    const monthKey = format(parseISO(transaction.transaction_date), "yyyy-MM");

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        totalAmount: 0,
        points: baseSeries.map((point) => ({ ...point })),
      });
    }

    const category = categoryMap.get(categoryId)!;
    category.totalAmount += transaction.amount_cents;

    const point = category.points.find((item) => item.key === monthKey);
    if (point) {
      point.amount += transaction.amount_cents;
    }
  }

  const categories = [...categoryMap.values()]
    .sort((left, right) => right.totalAmount - left.totalAmount)
    .map(({ categoryId, categoryName, totalAmount }) => ({
      categoryId,
      categoryName,
      totalAmount,
    }));

  const series = Object.fromEntries(
    [...categoryMap.values()].map((item) => [item.categoryId, item.points]),
  );

  return {
    success: true,
    data: {
      categories,
      series,
    },
  };
}

export async function fetchDashboardDrilldownTransactions(params: {
  type: "top-category" | "largest-transactions" | "subscriptions";
  from: string;
  to: string;
  categoryId?: string;
  limit?: number;
}): Promise<
  | { success: true; data: TransactionWithCategory[] }
  | { success: false; error: string }
> {
  const parsed = drilldownSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  if (parsed.data.type === "top-category" && !parsed.data.categoryId) {
    return {
      success: false,
      error: "Top category drilldown requires category.",
    };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const excludedIds = await getExcludedCategoryIds(
    supabase,
    profile.household_id,
  );

  let query = fetchSpendingTransactions(
    supabase,
    profile.household_id,
    parsed.data.from,
    parsed.data.to,
    excludedIds,
  );

  if (parsed.data.type === "top-category") {
    query = query.eq("category_id", parsed.data.categoryId!);
  }

  query = query
    .order("amount_cents", { ascending: false })
    .order("transaction_date", { ascending: false });

  if (parsed.data.type === "largest-transactions") {
    query = query.limit(parsed.data.limit ?? 5);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: "Failed to fetch drilldown transactions." };
  }

  const transactions = (data ?? []) as TransactionWithCategory[];

  return {
    success: true,
    data:
      parsed.data.type === "subscriptions"
        ? transactions.filter(
            (transaction) => transaction.categories?.name === "Subscriptions",
          )
        : transactions,
  };
}

export async function fetchRecentTransactions(
  from: string,
  to: string,
  limit: number = 10,
  categoryId?: string,
): Promise<
  | {
      success: true;
      data: { transactions: TransactionWithCategory[]; total: number };
    }
  | { success: false; error: string }
> {
  const result = await fetchTransactionList({
    from,
    to,
    page: 1,
    pageSize: limit,
    categoryId,
    sortBy: "transaction_date",
    sortDir: "desc",
    spendingOnly: true,
    excludeExcludedCategories: true,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      transactions: result.data.transactions,
      total: result.data.total,
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
  sortDir?: "asc" | "desc";
  spendingOnly?: boolean;
  excludeExcludedCategories?: boolean;
}): Promise<
  | { success: true; data: TransactionListResult }
  | { success: false; error: string }
> {
  const parsed = transactionListSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAuthenticated();
  if (!auth.authenticated) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile } = auth;
  const {
    from,
    to,
    page,
    pageSize,
    search,
    categoryId,
    sortBy,
    sortDir,
    spendingOnly,
    excludeExcludedCategories,
  } = parsed.data;

  let query = supabase
    .from("transactions")
    .select("*, categories(name, is_system, exclude_from_stats)", {
      count: "exact",
    })
    .eq("household_id", profile.household_id)
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  let totalAmountQuery = supabase
    .from("transactions")
    .select("amount_cents, is_debit")
    .eq("household_id", profile.household_id)
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  if (spendingOnly) {
    query = query.eq("is_debit", true);
    totalAmountQuery = totalAmountQuery.eq("is_debit", true);
  }

  if (excludeExcludedCategories) {
    const excludedIds = await getExcludedCategoryIds(
      supabase,
      profile.household_id,
    );
    query = applyExclusionFilter(query, excludedIds);
    totalAmountQuery = applyExclusionFilter(totalAmountQuery, excludedIds);
  }

  if (search) {
    query = query.ilike("description", `%${search}%`);
    totalAmountQuery = totalAmountQuery.ilike("description", `%${search}%`);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
    totalAmountQuery = totalAmountQuery.eq("category_id", categoryId);
  }

  const sortColumn =
    sortBy === "amount_cents" ||
    sortBy === "description" ||
    sortBy === "transaction_date"
      ? sortBy
      : "transaction_date";

  query = query.order(sortColumn, { ascending: sortDir === "asc" });

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  query = query.range(rangeFrom, rangeTo);

  const { data, count, error } = await query;
  const { data: totalAmountRows, error: totalAmountError } =
    await totalAmountQuery;

  if (error || totalAmountError) {
    return { success: false, error: "Failed to fetch transactions." };
  }

  const total = count ?? 0;
  const totalAmount = (totalAmountRows ?? []).reduce((sum, transaction) => {
    const amount = transaction.amount_cents ?? 0;
    return sum + (transaction.is_debit ? amount : -amount);
  }, 0);

  return {
    success: true,
    data: {
      transactions: (data ?? []) as TransactionWithCategory[],
      total,
      totalAmount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
