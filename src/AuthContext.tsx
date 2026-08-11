import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  displayName: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<boolean>;
  updateDisplayName: (displayName: string) => Promise<{ error: Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  const getDisplayName = (user: User | null): string | null => {
    return user?.user_metadata?.display_name || user?.user_metadata?.name || null;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshAdmin = useCallback(async () => {
    setAdminLoading(true);
    const currentUser = user ?? (await supabase.auth.getUser()).data.user;

    if (!currentUser) {
      setIsAdmin(false);
      setAdminLoading(false);
      return false;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    const allowed = !error && Boolean(data);
    setIsAdmin(allowed);
    setAdminLoading(false);
    return allowed;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    void refreshAdmin();
  }, [refreshAdmin, user]);

  // Community records keep an author snapshot for fast public rendering.
  // Reconcile that snapshot whenever a signed-in identity is loaded or changed.
  useEffect(() => {
    const activeName = getDisplayName(user);
    if (!user || !activeName) return;
    void Promise.all([
      supabase.from('community_posts').update({ author_name: activeName }).eq('user_id', user.id).neq('author_name', activeName),
      supabase.from('community_comments').update({ author_name: activeName }).eq('user_id', user.id).neq('author_name', activeName),
    ]);
  }, [user]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('docuai_session_started_at');
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  // Keep the workspace session predictable: navigation never signs a user out,
  // but an authenticated session ends after one hour or when they press Log out.
  useEffect(() => {
    if (!session) {
      localStorage.removeItem('docuai_session_started_at');
      return;
    }
    const existing = Number(localStorage.getItem('docuai_session_started_at'));
    const startedAt = Number.isFinite(existing) && existing > 0 ? existing : Date.now();
    localStorage.setItem('docuai_session_started_at', String(startedAt));
    const remaining = Math.max(0, 60 * 60 * 1000 - (Date.now() - startedAt));
    const timeout = window.setTimeout(() => { void signOut(); }, remaining);
    return () => window.clearTimeout(timeout);
  }, [session]);

  const updateDisplayName = async (displayName: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });

    if (!error) {
      const currentUser = user ?? (await supabase.auth.getUser()).data.user;
      if (currentUser) {
        const [postsResult, commentsResult] = await Promise.all([
          supabase.from('community_posts').update({ author_name: displayName }).eq('user_id', currentUser.id),
          supabase.from('community_comments').update({ author_name: displayName }).eq('user_id', currentUser.id),
        ]);
        const syncError = postsResult.error ?? commentsResult.error;
        if (syncError) return { error: syncError };
      }

      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }

    return { error };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://mkgzssdnfunberhtmrna.supabase.co/functions/v1/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAdmin,
      adminLoading,
      displayName: getDisplayName(user),
      signUp,
      signIn,
      signOut,
      refreshAdmin,
      updateDisplayName,
      sendPasswordReset,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
