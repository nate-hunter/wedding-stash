'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export async function signInWithEmail(formData: FormData) {
  // **************************************************************************
  console.log('*** /login/actions ( signInWithEmail ) ***');
  // **************************************************************************
  const supabase = await createClient();
  // **************************************************************************
  const email = formData.get('email') as string;
  console.log('[ DEV ] => MAGIC LINK `email`:', email);
  // **************************************************************************
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'https://localhost:3000/devo',
    },
  });
  console.log('[ DEV ] => MAGIC LINK DATA:', data);
  // **************************************************************************
  if (error) {
    redirect('/error');
  }
  revalidatePath('/', 'layout');
  redirect('/devo');
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) {
    redirect('/error');
  }
  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  const { error } = await supabase.auth.signUp(data);
  if (error) {
    redirect('/error');
  }
  revalidatePath('/', 'layout');
  redirect('/account');
}
