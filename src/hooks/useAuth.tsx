
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
  subscription: {
    subscribed: boolean;
    tier: string | null;
    end: string | null;
  };
  checkSubscription: () => Promise<void>;
  userProfile: any;
  userCompany: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState({
    subscribed: false,
    tier: null as string | null,
    end: null as string | null,
  });

  const loadUserData = async (userId: string) => {
    try {
      // Carregar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        return;
      }

      setUserProfile(profile);

      // Carregar dados da empresa se o usuário tiver uma
      if (profile?.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (companyError) {
          console.error('Erro ao carregar empresa:', companyError);
        } else {
          setUserCompany(company);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const checkSubscription = async () => {
    const currentSession = session || (await supabase.auth.getSession()).data.session;
    
    if (!currentSession) {
      console.log('No session available for subscription check');
      return;
    }

    try {
      console.log('Checking subscription status with session...');
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      console.log('Subscription check result:', data);

      const newSubscription = {
        subscribed: data.subscribed || false,
        tier: data.subscription_tier || null,
        end: data.subscription_end || null,
      };

      console.log('Setting subscription state:', newSubscription);
      setSubscription(newSubscription);

      if (data.subscribed && data.subscription_tier) {
        console.log(`Assinatura ativa detectada: plano ${data.subscription_tier.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session) {
          // Carregar dados do usuário
          setTimeout(() => {
            loadUserData(session.user.id);
            checkSubscription().catch(console.error);
          }, 1000);
        }

        if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setUserCompany(null);
          setSubscription({
            subscribed: false,
            tier: null,
            end: null,
          });
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session) {
        loadUserData(session.user.id);
        checkSubscription().catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificação periódica da assinatura
  useEffect(() => {
    if (!session || !user) return;

    const interval = setInterval(() => {
      console.log('Periodic subscription check...');
      checkSubscription().catch(console.error);
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [session, user]);

  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue mesmo se falhar
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        window.location.href = '/dashboard';
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue mesmo se falhar
      }
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    subscription,
    checkSubscription,
    userProfile,
    userCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
