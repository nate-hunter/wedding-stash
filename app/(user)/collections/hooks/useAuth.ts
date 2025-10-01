import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { TypedSupabaseClient } from '@/utils/supabase/types';
import { UseAuthResult } from '../types';

export function useAuth(supabase: TypedSupabaseClient): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        setUser(user);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication error';
        console.error('Auth initialization error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null); // Clear errors on auth state change
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading, error };
}
