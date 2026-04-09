'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { evaluateRules } from '@/lib/rules/evaluate-rules';
import type { MatchType } from '@/lib/types/database';

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { authorized: false as const, error: 'Unauthorized' };
  }

  return { authorized: true as const, profile, userId: user.id };
}

const createRuleSchema = z.object({
  pattern: z.string().min(1, 'Pattern cannot be empty'),
  matchType: z.enum(['substring', 'regex']),
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
    .from('rules')
    .select('sort_order')
    .eq('household_id', householdId)
    .eq('is_system', false)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newSortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data: rule, error } = await supabase
    .from('rules')
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
    return { success: false as const, error: 'Failed to create rule.' };
  }

  revalidatePath('/rules');
  return { success: true as const, rule };
}

const updateRuleSchema = z.object({
  id: z.string().uuid(),
  pattern: z.string().min(1, 'Pattern cannot be empty').optional(),
  matchType: z.enum(['substring', 'regex']).optional(),
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
    .from('rules')
    .select('is_system')
    .eq('id', input.id)
    .single();

  if (existing?.is_system) {
    return {
      success: false as const,
      error: 'System rules cannot be modified.',
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
    .from('rules')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error || !rule) {
    return { success: false as const, error: 'Failed to update rule.' };
  }

  revalidatePath('/rules');
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
    .from('rules')
    .select('is_system')
    .eq('id', ruleId)
    .single();

  if (existing?.is_system) {
    return {
      success: false as const,
      error: 'System rules cannot be deleted.',
    };
  }

  const { error } = await supabase.from('rules').delete().eq('id', ruleId);

  if (error) {
    return { success: false as const, error: 'Failed to delete rule.' };
  }

  revalidatePath('/rules');
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
    .from('rules')
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
    return { success: false as const, error: 'Failed to restore rule.' };
  }

  revalidatePath('/rules');
  return { success: true as const, rule };
}

export async function reorderRule(
  ruleId: string,
  direction: 'up' | 'down',
) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  // Fetch target rule
  const { data: target } = await supabase
    .from('rules')
    .select('sort_order, is_system, household_id')
    .eq('id', ruleId)
    .single();

  if (!target) {
    return { success: false as const, error: 'Rule not found.' };
  }

  if (target.is_system) {
    return {
      success: false as const,
      error: 'System rules cannot be reordered.',
    };
  }

  const householdId = target.household_id;
  const targetSortOrder = target.sort_order;

  // Find adjacent non-system rule
  let adjacentQuery = supabase
    .from('rules')
    .select('id, sort_order')
    .eq('household_id', householdId)
    .eq('is_system', false);

  if (direction === 'up') {
    adjacentQuery = adjacentQuery
      .lt('sort_order', targetSortOrder)
      .order('sort_order', { ascending: false })
      .limit(1);
  } else {
    adjacentQuery = adjacentQuery
      .gt('sort_order', targetSortOrder)
      .order('sort_order', { ascending: true })
      .limit(1);
  }

  const { data: adjacent } = await adjacentQuery.single();

  if (!adjacent) {
    return { success: false as const, error: 'Cannot move further' };
  }

  // Swap sort_order values
  const { error: err1 } = await supabase
    .from('rules')
    .update({ sort_order: adjacent.sort_order })
    .eq('id', ruleId);

  const { error: err2 } = await supabase
    .from('rules')
    .update({ sort_order: targetSortOrder })
    .eq('id', adjacent.id);

  if (err1 || err2) {
    return { success: false as const, error: 'Failed to reorder rule.' };
  }

  revalidatePath('/rules');
  return { success: true as const };
}

export async function recategorizeAll() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const householdId = auth.profile.household_id;
  const supabase = await createClient();

  // Fetch all rules sorted by sort_order
  const { data: rules, error: rulesError } = await supabase
    .from('rules')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true });

  if (rulesError || !rules) {
    return { success: false as const, error: 'Failed to fetch rules.' };
  }

  // Fetch all transactions
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, description, category_id')
    .eq('household_id', householdId);

  if (txError || !transactions) {
    return {
      success: false as const,
      error: 'Failed to fetch transactions.',
    };
  }

  // Map transactions to TransactionLike format
  const txLikes = transactions.map((tx) => ({
    hash: tx.id,
    description: tx.description,
  }));

  // Evaluate rules
  const categoryMap = evaluateRules(txLikes, rules);

  // Group transactions by new category_id where it differs
  let updated = 0;
  let unchanged = 0;

  const updateGroups = new Map<string, string[]>();

  for (const tx of transactions) {
    const newCatId = categoryMap.get(tx.id) ?? null;
    const currentCatId = tx.category_id ?? null;

    if (newCatId !== currentCatId) {
      if (newCatId) {
        const group = updateGroups.get(newCatId) ?? [];
        group.push(tx.id);
        updateGroups.set(newCatId, group);
      } else if (currentCatId) {
        // Rule no longer matches -- clear category
        const group = updateGroups.get('__null__') ?? [];
        group.push(tx.id);
        updateGroups.set('__null__', group);
      }
    } else {
      unchanged++;
    }
  }

  // Apply updates
  for (const [catId, txIds] of updateGroups) {
    if (catId === '__null__') {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: null })
        .in('id', txIds);

      if (error) {
        return {
          success: false as const,
          error: `Failed to clear categories for ${txIds.length} transaction(s): ${error.message}`,
        };
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: catId })
        .in('id', txIds);

      if (error) {
        return {
          success: false as const,
          error: `Failed to assign category ${catId} to ${txIds.length} transaction(s): ${error.message}`,
        };
      }
    }
    updated += txIds.length;
  }

  revalidatePath('/rules');
  revalidatePath('/import');
  return { success: true as const, updated, unchanged };
}
