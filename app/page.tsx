import { createClient } from '@/utils/supabase/server';

import HomePage from './(root)/HomePage';

export default async function HomePageWrapper() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('# PAGE #', { user });

  return <HomePage />;
}

