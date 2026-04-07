import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserTable } from '@/components/user-table';
import { AddUserForm } from '@/components/add-user-form';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if current user is admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!currentProfile || currentProfile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all household profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Household Members</h2>
        <AddUserForm />
      </div>

      <UserTable profiles={profiles ?? []} currentUserId={user.id} />

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">System</h2>
        <Link
          href="/settings/bank-configs"
          className="inline-flex items-center gap-2 px-4 py-3 border-2 border-border bg-secondary-background font-bold hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none shadow-shadow transition-all"
        >
          Bank Configurations
          <span className="text-muted-foreground font-normal">View configured bank statement formats</span>
        </Link>
      </div>
    </div>
  );
}
