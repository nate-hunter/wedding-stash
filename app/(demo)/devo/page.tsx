import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export default async function DemoPrivatePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  // const { data, error } = await supabase.auth.getUser()
  // if (error || !data?.user) {
  if (error || !user) {
    redirect('/login');
  }

  console.log('<<< DemoPrivatePage>>>');
  // console.log('$$ { data }: ', data)
  console.log('$$ { user }: ', user);
  console.log('$$ { error }: ', error);

  return (
    <div>
      <h2>DEMO PRIVATE PAGE....</h2>
      {/* <p>Hello {data.user.email}</p></div> */}
      <p>Hello {user.email}</p>
    </div>
  );
}
