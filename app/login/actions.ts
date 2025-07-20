'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  // Basic email validation
  if (!email || !email.includes('@')) {
    redirect('/login?error=invalid-email');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'http://localhost:6311/auth/confirm',
    },
  });
  if (error) {
    // Handle specific error types
    if (error.message.includes('rate limit')) {
      redirect('/login?error=rate-limited');
    } else if (error.message.includes('invalid email')) {
      redirect('/login?error=invalid-email');
    } else {
      redirect('/login?error=unknown');
    }
  }

  // Success - redirect to a page that shows the magic link was sent
  redirect('/login?success=true');
}
