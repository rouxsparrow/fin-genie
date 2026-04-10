"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { evaluateRules } from "@/lib/rules/evaluate-rules";
import {
  REPLACE_RULES_CONFIRMATION,
  normalizeCategoryName,
  ruleExportV1Schema,
  validateRuleExportRegexes,
  type RuleExportV1,
} from "@/lib/rules/rule-import-export";
import type {
  Category,
  MatchType,
  Rule,
  Transaction,
} from "@/lib/types/database";

type CategoryNameJoin = { name: string } | { name: string }[] | null;
type RuleWithCategoryJoin = Rule & { categories: CategoryNameJoin };
type RuleWithCategory = Rule & { categories: { name: string } };
type TransactionWithCategory = Pick<
  Transaction,
  "id" | "description" | "category_id"
> & {
  categories: CategoryNameJoin;
};

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { authorized: false as const, error: "Unauthorized" };
  }

  return { authorized: true as const, profile, userId: user.id };
}

const createRuleSchema = z.object({
  pattern: z.string().min(1, "Pattern cannot be empty"),
  matchType: z.enum(["substring", "regex"]),
  categoryId: z.string().uuid(),
});

export async function createRule(input: {
  pattern: string;
  matchType: MatchType;
  categoryId: string;
}) {
  const parsed = createRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const householdId = auth.profile.household_id;
  const supabase = await createClient();

  // Get max sort_order among non-system rules
  const { data: maxRow } = await supabase
    .from("rules")
    .select("sort_order")
    .eq("household_id", householdId)
    .eq("is_system", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const newSortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data: rule, error } = await supabase
    .from("rules")
    .insert({
      household_id: householdId,
      category_id: parsed.data.categoryId,
      pattern: parsed.data.pattern,
      match_type: parsed.data.matchType,
      sort_order: newSortOrder,
      is_system: false,
    })
    .select()
    .single();

  if (error || !rule) {
    return { success: false as const, error: "Failed to create rule." };
  }

  revalidatePath("/rules");
  return { success: true as const, rule };
}

const updateRuleSchema = z.object({
  id: z.string().uuid(),
  pattern: z.string().min(1, "Pattern cannot be empty").optional(),
  matchType: z.enum(["substring", "regex"]).optional(),
  categoryId: z.string().uuid().optional(),
});

export async function updateRule(input: {
  id: string;
  pattern?: string;
  matchType?: MatchType;
  categoryId?: string;
}) {
  const parsed = updateRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  // Check rule is not system
  const { data: existing } = await supabase
    .from("rules")
    .select("is_system")
    .eq("id", input.id)
    .single();

  if (existing?.is_system) {
    return {
      success: false as const,
      error: "System rules cannot be modified.",
    };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.pattern !== undefined)
    updateData.pattern = parsed.data.pattern;
  if (parsed.data.matchType !== undefined)
    updateData.match_type = parsed.data.matchType;
  if (parsed.data.categoryId !== undefined)
    updateData.category_id = parsed.data.categoryId;

  const { data: rule, error } = await supabase
    .from("rules")
    .update(updateData)
    .eq("id", input.id)
    .select()
    .single();

  if (error || !rule) {
    return { success: false as const, error: "Failed to update rule." };
  }

  revalidatePath("/rules");
  return { success: true as const, rule };
}

export async function deleteRule(ruleId: string) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  // Check rule is not system
  const { data: existing } = await supabase
    .from("rules")
    .select("is_system")
    .eq("id", ruleId)
    .single();

  if (existing?.is_system) {
    return {
      success: false as const,
      error: "System rules cannot be deleted.",
    };
  }

  const { error } = await supabase.from("rules").delete().eq("id", ruleId);

  if (error) {
    return { success: false as const, error: "Failed to delete rule." };
  }

  revalidatePath("/rules");
  return { success: true as const };
}

export async function restoreRule(input: {
  pattern: string;
  matchType: MatchType;
  categoryId: string;
  sortOrder: number;
}) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const householdId = auth.profile.household_id;
  const supabase = await createClient();

  const { data: rule, error } = await supabase
    .from("rules")
    .insert({
      household_id: householdId,
      category_id: input.categoryId,
      pattern: input.pattern,
      match_type: input.matchType,
      sort_order: input.sortOrder,
      is_system: false,
    })
    .select()
    .single();

  if (error || !rule) {
    return { success: false as const, error: "Failed to restore rule." };
  }

  revalidatePath("/rules");
  return { success: true as const, rule };
}

export async function reorderRule(ruleId: string, direction: "up" | "down") {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  // Fetch target rule
  const { data: target } = await supabase
    .from("rules")
    .select("sort_order, is_system, household_id")
    .eq("id", ruleId)
    .single();

  if (!target) {
    return { success: false as const, error: "Rule not found." };
  }

  if (target.is_system) {
    return {
      success: false as const,
      error: "System rules cannot be reordered.",
    };
  }

  const householdId = target.household_id;
  const targetSortOrder = target.sort_order;

  // Find adjacent non-system rule
  let adjacentQuery = supabase
    .from("rules")
    .select("id, sort_order")
    .eq("household_id", householdId)
    .eq("is_system", false);

  if (direction === "up") {
    adjacentQuery = adjacentQuery
      .lt("sort_order", targetSortOrder)
      .order("sort_order", { ascending: false })
      .limit(1);
  } else {
    adjacentQuery = adjacentQuery
      .gt("sort_order", targetSortOrder)
      .order("sort_order", { ascending: true })
      .limit(1);
  }

  const { data: adjacent } = await adjacentQuery.single();

  if (!adjacent) {
    return { success: false as const, error: "Cannot move further" };
  }

  // Swap sort_order values
  const { error: err1 } = await supabase
    .from("rules")
    .update({ sort_order: adjacent.sort_order })
    .eq("id", ruleId);

  const { error: err2 } = await supabase
    .from("rules")
    .update({ sort_order: targetSortOrder })
    .eq("id", adjacent.id);

  if (err1 || err2) {
    return { success: false as const, error: "Failed to reorder rule." };
  }

  revalidatePath("/rules");
  return { success: true as const };
}

function getJoinedCategoryName(categories: CategoryNameJoin) {
  if (Array.isArray(categories)) {
    return categories[0]?.name ?? "Uncategorized";
  }

  return categories?.name ?? "Uncategorized";
}

function normalizeRuleWithCategory(
  rule: RuleWithCategoryJoin,
): RuleWithCategory {
  return {
    ...rule,
    categories: { name: getJoinedCategoryName(rule.categories) },
  };
}

async function getRecategorizationPlan(householdId: string) {
  const supabase = await createClient();

  const { data: rules, error: rulesError } = await supabase
    .from("rules")
    .select("*")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });

  if (rulesError || !rules) {
    return { success: false as const, error: "Failed to fetch rules." };
  }

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("id, description, category_id, categories(name)")
    .eq("household_id", householdId);

  if (txError || !transactions) {
    return {
      success: false as const,
      error: "Failed to fetch transactions.",
    };
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("household_id", householdId);

  if (categoriesError || !categories) {
    return {
      success: false as const,
      error: "Failed to fetch categories.",
    };
  }

  const txRows = transactions as unknown as TransactionWithCategory[];
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const categoryMap = evaluateRules(
    txRows.map((tx) => ({
      hash: tx.id,
      description: tx.description,
    })),
    rules,
  );

  let changed = 0;
  let unchanged = 0;
  const sample: Array<{
    id: string;
    description: string;
    oldCategory: string;
    newCategory: string;
  }> = [];
  const updateGroups = new Map<string, string[]>();

  for (const tx of txRows) {
    const newCatId = categoryMap.get(tx.id) ?? null;
    const currentCatId = tx.category_id ?? null;

    if (newCatId === currentCatId) {
      unchanged++;
      continue;
    }

    changed++;

    if (sample.length < 5) {
      sample.push({
        id: tx.id,
        description: tx.description,
        oldCategory: getJoinedCategoryName(tx.categories),
        newCategory: newCatId
          ? (categoryNameById.get(newCatId) ?? "Uncategorized")
          : "Uncategorized",
      });
    }

    const groupKey = newCatId ?? "__null__";
    const group = updateGroups.get(groupKey) ?? [];
    group.push(tx.id);
    updateGroups.set(groupKey, group);
  }

  return {
    success: true as const,
    changed,
    unchanged,
    sample,
    updateGroups,
  };
}

export async function previewRecategorization() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const plan = await getRecategorizationPlan(auth.profile.household_id);
  if (!plan.success) return plan;

  return {
    success: true as const,
    changed: plan.changed,
    unchanged: plan.unchanged,
    sample: plan.sample,
  };
}

export async function applyRecategorization() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const plan = await getRecategorizationPlan(auth.profile.household_id);
  if (!plan.success) return plan;

  const supabase = await createClient();
  let updated = 0;

  // Apply updates
  for (const [catId, txIds] of plan.updateGroups) {
    if (catId === "__null__") {
      const { error } = await supabase
        .from("transactions")
        .update({ category_id: null })
        .in("id", txIds);

      if (error) {
        return {
          success: false as const,
          error: `Failed to clear categories for ${txIds.length} transaction(s): ${error.message}`,
        };
      }
    } else {
      const { error } = await supabase
        .from("transactions")
        .update({ category_id: catId })
        .in("id", txIds);

      if (error) {
        return {
          success: false as const,
          error: `Failed to assign category ${catId} to ${txIds.length} transaction(s): ${error.message}`,
        };
      }
    }
    updated += txIds.length;
  }

  revalidatePath("/rules");
  revalidatePath("/import");
  return { success: true as const, updated, unchanged: plan.unchanged };
}

export async function recategorizeAll() {
  return applyRecategorization();
}

export async function exportUserRules() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from("rules")
    .select("pattern, match_type, sort_order, categories(name)")
    .eq("household_id", auth.profile.household_id)
    .eq("is_system", false)
    .order("sort_order", { ascending: true });

  if (error || !rules) {
    return { success: false as const, error: "Failed to export user rules." };
  }

  const payload: RuleExportV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    rules: (rules as unknown as RuleWithCategoryJoin[]).map((rule) => ({
      pattern: rule.pattern,
      matchType: rule.match_type,
      categoryName: getJoinedCategoryName(rule.categories),
      sortOrder: rule.sort_order,
    })),
  };

  return { success: true as const, payload };
}

export async function importUserRules(input: {
  payload: unknown;
  mode: "replace";
  confirmation: string;
}) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  if (
    input.mode !== "replace" ||
    input.confirmation !== REPLACE_RULES_CONFIRMATION
  ) {
    return {
      success: false as const,
      error: "Type REPLACE USER RULES to confirm replace import.",
    };
  }

  const parsed = ruleExportV1Schema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Invalid rule export JSON.",
    };
  }

  const regexResult = validateRuleExportRegexes(parsed.data.rules);
  if (!regexResult.success) {
    return { success: false as const, error: regexResult.error };
  }

  const householdId = auth.profile.household_id;
  const supabase = await createClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", householdId);

  if (categoriesError || !categories) {
    return { success: false as const, error: "Failed to fetch categories." };
  }

  const categoryByName = new Map<string, Category>();
  for (const category of categories) {
    categoryByName.set(normalizeCategoryName(category.name), category);
  }

  const createdCategories: string[] = [];

  for (const rule of parsed.data.rules) {
    const normalizedName = normalizeCategoryName(rule.categoryName);
    if (categoryByName.has(normalizedName)) continue;

    const categoryName = rule.categoryName.trim();
    const { data: createdCategory, error: createCategoryError } = await supabase
      .from("categories")
      .insert({
        household_id: householdId,
        name: categoryName,
        is_system: false,
      })
      .select()
      .single();

    if (createCategoryError || !createdCategory) {
      return {
        success: false as const,
        error: `Failed to create category ${categoryName}.`,
      };
    }

    categoryByName.set(normalizedName, createdCategory);
    createdCategories.push(categoryName);
  }

  const insertRows = parsed.data.rules.map((rule, index) => {
    const category = categoryByName.get(
      normalizeCategoryName(rule.categoryName),
    );

    if (!category) {
      throw new Error(`Missing category ${rule.categoryName}.`);
    }

    return {
      household_id: householdId,
      category_id: category.id,
      pattern: rule.pattern,
      match_type: rule.matchType,
      sort_order: rule.sortOrder ?? index + 1,
      is_system: false,
    };
  });

  const { error: deleteError } = await supabase
    .from("rules")
    .delete()
    .eq("household_id", householdId)
    .eq("is_system", false);

  if (deleteError) {
    return { success: false as const, error: "Failed to replace user rules." };
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase
      .from("rules")
      .insert(insertRows);

    if (insertError) {
      return { success: false as const, error: "Failed to import user rules." };
    }
  }

  const { data: rules, error: rulesError } = await supabase
    .from("rules")
    .select("*, categories(name)")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });

  if (rulesError || !rules) {
    return {
      success: false as const,
      error: "Failed to fetch imported rules.",
    };
  }

  const { data: refreshedCategories, error: refreshedCategoriesError } =
    await supabase
      .from("categories")
      .select("*")
      .eq("household_id", householdId)
      .order("is_system", { ascending: false })
      .order("name");

  if (refreshedCategoriesError || !refreshedCategories) {
    return { success: false as const, error: "Failed to fetch categories." };
  }

  revalidatePath("/rules");
  revalidatePath("/import");

  return {
    success: true as const,
    imported: insertRows.length,
    createdCategories,
    rules: (rules as unknown as RuleWithCategoryJoin[]).map(
      normalizeRuleWithCategory,
    ),
    categories: refreshedCategories,
  };
}
