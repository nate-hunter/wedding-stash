import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

import AccountForm from './account-form';

export default async function Account() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect to login if no user
  if (!user || error) {
    redirect('/login');
  }

  return <AccountForm user={user} />;
}
