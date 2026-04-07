import { createClient } from '@/lib/supabase/server';
import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ImportHistoryTable } from '@/components/history/import-history-table';
import { TimelineBar } from '@/components/history/timeline-bar';

export default async function ImportHistoryPage() {
  const supabase = await createClient();

  // Fetch imports sorted newest first
  // RLS on imports table restricts to household via get_my_household_id()
  const { data: imports } = await supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false });

  if (!imports || imports.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold">Import History</h1>
        <div className="h-8" />
        <EmptyState
          icon={FileText}
          heading="No imports yet"
          body="Upload your first bank statement to start tracking your spending."
          ctaLabel="Import Statement"
          ctaHref="/import"
        />
      </div>
    );
  }

  // Fetch profile names for importers
  // imported_by references auth.users(id), profiles share the same id
  const importerIds = [...new Set(imports.map((imp) => imp.imported_by))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', importerIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  // Merge profile names into import records
  const importsWithProfiles = imports.map((imp) => ({
    ...imp,
    profiles: profileMap.has(imp.imported_by)
      ? { full_name: profileMap.get(imp.imported_by)! }
      : null,
  }));

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold">Import History</h1>
      <div className="h-4" />
      <TimelineBar imports={importsWithProfiles} />
      <div className="h-6" />
      <ImportHistoryTable imports={importsWithProfiles} />
    </div>
  );
}
