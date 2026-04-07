'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty').max(50),
});

export async function createCategory(input: { name: string }) {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const householdId = auth.profile.household_id;
  const supabase = await createClient();

  // Check uniqueness
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('name', parsed.data.name)
    .single();

  if (existing) {
    return {
      success: false as const,
      error: 'A category with this name already exists.',
    };
  }

  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      household_id: householdId,
      name: parsed.data.name,
      is_system: false,
    })
    .select()
    .single();

  if (error || !category) {
    return { success: false as const, error: 'Failed to create category.' };
  }

  revalidatePath('/categories');
  return { success: true as const, category };
}

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name cannot be empty').max(50),
});

export async function updateCategory(input: { id: string; name: string }) {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  // Check not system category
  const { data: existing } = await supabase
    .from('categories')
    .select('is_system, household_id')
    .eq('id', input.id)
    .single();

  if (existing?.is_system) {
    return {
      success: false as const,
      error: 'System categories cannot be modified.',
    };
  }

  // Check uniqueness of new name within household
  if (existing) {
    const { data: duplicate } = await supabase
      .from('categories')
      .select('id')
      .eq('household_id', existing.household_id)
      .eq('name', parsed.data.name)
      .neq('id', input.id)
      .single();

    if (duplicate) {
      return {
        success: false as const,
        error: 'A category with this name already exists.',
      };
    }
  }

  const { data: category, error } = await supabase
    .from('categories')
    .update({ name: parsed.data.name })
    .eq('id', input.id)
    .select()
    .single();

  if (error || !category) {
    return { success: false as const, error: 'Failed to update category.' };
  }

  revalidatePath('/categories');
  return { success: true as const, category };
}

export async function deleteCategory(categoryId: string) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const supabase = await createClient();

  // Check not system category
  const { data: existing } = await supabase
    .from('categories')
    .select('is_system, name')
    .eq('id', categoryId)
    .single();

  if (existing?.is_system) {
    return {
      success: false as const,
      error: 'System categories cannot be deleted.',
    };
  }

  // Check no rules reference it
  const { count } = await supabase
    .from('rules')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (count && count > 0) {
    return {
      success: false as const,
      error: `Cannot delete '${existing?.name ?? 'category'}'. ${count} rule${count === 1 ? '' : 's'} use this category.`,
    };
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    return { success: false as const, error: 'Failed to delete category.' };
  }

  revalidatePath('/categories');
  return { success: true as const };
}

export async function restoreCategory(input: {
  name: string;
  isSystem: boolean;
}) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const householdId = auth.profile.household_id;
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      household_id: householdId,
      name: input.name,
      is_system: input.isSystem,
    })
    .select()
    .single();

  if (error || !category) {
    return { success: false as const, error: 'Failed to restore category.' };
  }

  revalidatePath('/categories');
  return { success: true as const, category };
}

export async function fetchCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    return { success: false as const, error: 'Failed to fetch categories.' };
  }

  return { success: true as const, categories: data };
}
