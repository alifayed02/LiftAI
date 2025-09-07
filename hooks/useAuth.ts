import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        setSession(session ?? null);
        setUser(session?.user ?? null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    return { error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    return { error };
  }, []);

  const value = useMemo(
    () => ({ session, user, loading, error, signInWithEmail, signUpWithEmail, signOut }),
    [session, user, loading, error, signInWithEmail, signUpWithEmail, signOut]
  );

  return value;
}
