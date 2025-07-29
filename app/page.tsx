import { createClient } from '@/utils/supabase/server';

import Button from './components/Button/Button';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className='min-h-screen surface-bg'>
      <div className='max-w-4xl mx-auto px-sp0 py-sp0'>
        <div className='text-center'>
          {/* <h1 className='text-4xl font-bold text-ocean-midnight mb-sp2 text-heading'>Wedding Photo Stash</h1> */}
          {/* <h1 className='font-bold text-gold-500 p-sp-1 text-heading'>Wedding Photo Stash</h1> */}
          {/* <p className='text-lg text-body text-ocean-midnight-op-75 mb-sp4 max-w-xl mx-auto'>
            Secure, elegant storage for your most precious moments
          </p> */}

          {user ? (
            // Authenticated user content
            <div className='space-y-sp3'>
              <div className='card max-w-lg mx-auto'>
                <div className='card-body'>
                  <h2 className='text-xl font-semibold text-ocean-midnight p-sp2 text-heading'>
                    Welcome back, {user.email}!
                  </h2>
                  {/* <p className='text-body text-ocean-midnight-op-75 mb-sp3'>
                    Your wedding photos are safely stored and ready to be shared with loved ones.
                  </p> */}

                  <div className='flex justify-center gap-sp2'>
                    {/* <Button asLink href='/upload' variant='primary' text='Upload Photos' width={150} /> */}
                    <Button
                      asLink
                      href='/account'
                      // variant='primary'
                      // bg='inverted'
                      text='Account Settings'
                      width={150}
                      isBordered
                    />
                  </div>
                </div>
              </div>

              {/* <form action='/auth/signout' method='post'>
                <Button type='submit' bg='inverted' width={150} text='Sign out' />
              </form> */}
            </div>
          ) : (
            // Unauthenticated user content
            <div>
              <div>
                <Button asLink href='/login' width={150}>
                  Sign In to Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
