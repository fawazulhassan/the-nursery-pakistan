import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CACHE_PREFIX = 'nursery_admin_role:';
const ADMIN_CACHE_TTL_MS = 3600000;

interface AdminCacheEntry {
  value: boolean;
  ts: number;
}

function readAdminCache(userId: string): boolean | null {
  try {
    const raw = localStorage.getItem(`${ADMIN_CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as AdminCacheEntry;
    if (typeof entry?.value !== 'boolean' || typeof entry?.ts !== 'number') {
      return null;
    }
    if (Date.now() - entry.ts > ADMIN_CACHE_TTL_MS) {
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function writeAdminCache(userId: string, isAdmin: boolean): void {
  try {
    const entry: AdminCacheEntry = { value: isAdmin, ts: Date.now() };
    localStorage.setItem(`${ADMIN_CACHE_PREFIX}${userId}`, JSON.stringify(entry));
  } catch {
    // Storage unavailable (private mode, quota, etc.) – treat as cache miss next time.
  }
}

function clearAdminCache(userId?: string): void {
  try {
    if (userId) {
      localStorage.removeItem(`${ADMIN_CACHE_PREFIX}${userId}`);
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(ADMIN_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Best-effort: ignore storage errors.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkedUserIdRef = useRef<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const checkAdminStatus = async (userId: string): Promise<void> => {
    if (checkedUserIdRef.current === userId) {
      return;
    }
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    const cached = readAdminCache(userId);
    if (cached !== null) {
      setIsAdmin(cached);
      checkedUserIdRef.current = userId;
      return;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        const isUserAdmin = !!data;
        writeAdminCache(userId, isUserAdmin);
        setIsAdmin(isUserAdmin);
        checkedUserIdRef.current = userId;
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = promise;
    await promise;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (event === 'INITIAL_SESSION') {
          if (nextSession?.user) {
            setTimeout(() => {
              void checkAdminStatus(nextSession.user.id);
            }, 0);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          if (nextSession?.user) {
            setTimeout(() => {
              void checkAdminStatus(nextSession.user.id);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          checkedUserIdRef.current = null;
          inFlightRef.current = null;
          clearAdminCache();
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = import.meta.env.VITE_EMAIL_REDIRECT_URL || `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "You can now log in with your credentials.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    checkedUserIdRef.current = null;
    inFlightRef.current = null;
    clearAdminCache();
    setIsAdmin(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
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
