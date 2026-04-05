'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types/database';
import { z } from 'zod';

function createServiceRoleClient() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(100),
  role: z.enum(['admin', 'viewer']),
});

const removeUserSchema = z.object({
  userId: z.string().uuid(),
});

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.enum(['admin', 'viewer']),
});

export async function createUser(input: {
  email: string;
  fullName: string;
  role: 'admin' | 'viewer';
}): Promise<{ success?: boolean; error?: string }> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid input. Please check your fields and try again.' };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error };
  }

  const serviceClient = createServiceRoleClient();

  // Create auth user with temporary password
  const { data: authData, error: authError } =
    await serviceClient.auth.admin.createUser({
      email: parsed.data.email,
      password: crypto.randomUUID().slice(0, 12),
      email_confirm: true,
    });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      return { error: 'A user with this email already exists.' };
    }
    return { error: 'Failed to create user account. Please try again.' };
  }

  if (!authData.user) {
    return { error: 'Failed to create user account. Please try again.' };
  }

  // Insert profile
  const { error: profileError } = await serviceClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      household_id: '00000000-0000-0000-0000-000000000000',
    });

  if (profileError) {
    // Clean up auth user if profile insert fails
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    return { error: 'Failed to create user profile. Please try again.' };
  }

  // Send password reset email so user can set their own password
  await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: parsed.data.email,
  });

  revalidatePath('/settings');
  return { success: true };
}

export async function removeUser(input: {
  userId: string;
}): Promise<{ success?: boolean; error?: string }> {
  const parsed = removeUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid user ID.' };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error };
  }

  const serviceClient = createServiceRoleClient();

  // Check if target user is the last admin
  const { data: targetProfile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', parsed.data.userId)
    .single();

  if (targetProfile?.role === 'admin') {
    const { count } = await serviceClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count !== null && count <= 1) {
      return {
        error:
          'You are the only admin. Add another admin before removing yourself.',
      };
    }
  }

  // Delete auth user (cascades to profile via FK ON DELETE CASCADE)
  const { error: deleteError } =
    await serviceClient.auth.admin.deleteUser(parsed.data.userId);

  if (deleteError) {
    return { error: 'Failed to remove user. Please try again.' };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateUserRole(input: {
  userId: string;
  newRole: 'admin' | 'viewer';
}): Promise<{ success?: boolean; error?: string }> {
  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error };
  }

  // If demoting an admin to viewer, check last admin protection
  if (parsed.data.newRole === 'viewer') {
    const supabase = await createClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', parsed.data.userId)
      .single();

    if (targetProfile?.role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (count !== null && count <= 1) {
        return {
          error:
            'You are the only admin. Add another admin before removing yourself.',
        };
      }
    }
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: parsed.data.newRole })
    .eq('id', parsed.data.userId);

  if (updateError) {
    return { error: 'Failed to update role. Please try again.' };
  }

  revalidatePath('/settings');
  return { success: true };
}
