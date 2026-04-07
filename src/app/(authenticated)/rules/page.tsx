import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RulesTable } from '@/components/rules/rules-table';
import { EmptyState } from '@/components/empty-state';
import { ListFilter } from 'lucide-react';
import type { Rule } from '@/lib/types/database';

type RuleWithCategory = Rule & { categories: { name: string } };

export default async function RulesPage() {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch rules with category name joined
  const { data: rules } = await supabase
    .from('rules')
    .select('*, categories(name)')
    .eq('household_id', profile.household_id)
    .order('sort_order', { ascending: true });

  // Fetch categories for edit form dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('name');

  const allRules = (rules ?? []) as unknown as RuleWithCategory[];
  const userRules = allRules.filter((r) => !r.is_system);

  return (
    <div className="pb-20">
      <h1 className="text-2xl font-bold">Rules</h1>

      <div className="h-6" />

      {allRules.length === 0 ? (
        <EmptyState
          icon={<ListFilter size={48} />}
          heading="No rules yet"
          body="Create your first rule to start categorizing transactions automatically."
        />
      ) : (
        <RulesTable
          initialRules={allRules}
          categories={categories ?? []}
        />
      )}
    </div>
  );
}
