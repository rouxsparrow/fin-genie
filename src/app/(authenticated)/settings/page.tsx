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
    </div>
  );
}
