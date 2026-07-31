'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
let supabaseError: Error | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseError = new Error('Missing Supabase credentials in environment variables');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    supabaseError = e instanceof Error ? e : new Error(String(e));
  }
}

export { supabase, supabaseError };

// Auth functions
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: { name?: string; phone?: string } = {}
) {
  if (!supabase) {
    return { data: null, error: supabaseError };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: metadata.name,
        phone: metadata.phone,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?email=${encodeURIComponent(email)}`,
    },
  });

  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    return { data: null, error: supabaseError };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  if (!supabase) {
    return { error: supabaseError };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  if (!supabase) {
    return { data: null, error: supabaseError };
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  return { data, error };
}

export async function updatePassword(newPassword: string) {
  if (!supabase) {
    return { data: null, error: supabaseError };
  }
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

export async function getCurrentUser() {
  if (!supabase) {
    throw supabaseError;
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getSession() {
  if (!supabase) {
    throw supabaseError;
  }
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function verifyOtp(email: string, token: string, type: 'email' | 'sms' = 'email') {
  if (!supabase) {
    return { data: null, error: supabaseError };
  }
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  return { data, error };
}

export async function resendVerificationEmail(email: string) {
  if (!supabase) {
    return { data: null, error: supabaseError };
  }
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  return { data, error };
}
