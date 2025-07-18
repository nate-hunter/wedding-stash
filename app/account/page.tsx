import AccountForm from './account-form';
import { createClient } from '@/utils/supabase/server';

export default async function Account() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('<<< AccountPage>>>');
  console.log('$$ { user }: ', user);
  console.log('$$ { error }: ', error);

  return <AccountForm user={user} />;
}
