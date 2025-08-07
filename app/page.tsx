import { createClient } from '@/utils/supabase/server';

import RootPage from './(root)/RootPage';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className='min-h-screen surface-bg'>
      <div className='max-w-4xl mx-auto px-sp0 py-sp0'>
        <RootPage user={user} />
      </div>
    </div>
  );
}
