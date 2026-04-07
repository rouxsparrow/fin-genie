import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CategoriesList } from '@/components/categories/categories-list';
import { EmptyState } from '@/components/empty-state';
import { Tags } from 'lucide-react';

export default async function CategoriesPage() {
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

  // Fetch categories: system first, then alphabetical
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  const allCategories = categories ?? [];

  return (
    <div className="pb-20">
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="h-2" />
      <p className="text-sm font-medium opacity-60">
        Categories organize your transactions. Assign rules to categories to
        auto-categorize imports.
      </p>

      <div className="h-6" />

      {allCategories.length === 0 ? (
        <EmptyState
          icon={Tags}
          heading="No categories yet"
          body="Categories will be created when you set up your first categorization rule."
          ctaLabel="Go to Rules"
          ctaHref="/rules"
        />
      ) : (
        <CategoriesList initialCategories={allCategories} />
      )}
    </div>
  );
}
