import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface AuthError {
  message: string;
  code?: string;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  permissions: Record<string, string[]>;
  is_active: boolean;
}

export const useAuth = (supabase: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Get initial session - this is the proper pattern from Supabase docs
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        loadAdminUser(session.user.email).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes after initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        setUser(session?.user ?? null);
        if (session?.user?.email) {
          loadAdminUser(session.user.email);
        } else {
          setAdminUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const loadAdminUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, role, permissions, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setAdminUser(data);
        // Update last login in background - don't await
        supabase
          .from('admin_users')
          .update({ 
            last_login: new Date().toISOString(),
            failed_login_attempts: 0,
            lockout_until: null
          })
          .eq('id', data.id)
          .then(() => {})
          .catch(() => {}); // Fail silently
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Error loading admin user:', error);
      setAdminUser(null);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    
    try {
      // First check if user exists and is not locked out
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('lockout_until, failed_login_attempts')
        .eq('email', email)
        .single();

      if (adminData?.lockout_until && new Date(adminData.lockout_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(adminData.lockout_until).getTime() - Date.now()) / 60000);
        setError({ 
          message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
          code: 'ACCOUNT_LOCKED'
        });
        return { error: true };
      }

      // Attempt sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Handle failed login
        await supabase.rpc('handle_failed_login', { p_email: email });
        
        if (authError.message.includes('Invalid login credentials')) {
          setError({ 
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          });
        } else {
          setError({ 
            message: authError.message,
            code: authError.name
          });
        }
        return { error: true };
      }

      // Reset failed attempts on successful login
      if (data.user) {
        await supabase.rpc('reset_failed_login_attempts', { p_user_id: data.user.id });
        await loadAdminUser(data.user.email!);
      }

      return { error: false, user: data.user };
    } catch (error: any) {
      setError({ 
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      });
      return { error: true };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/admin`
      }
    });
    if (error) {
      setError({ message: error.message });
    }
  };

  const signOut = async () => {
    
    try {
      // Clear all storage first
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Force clear the state
      setUser(null);
      setAdminUser(null);
      setLoading(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Handle error silently
      }
      
      return { success: true };
    } catch (error) {
      setUser(null);
      setAdminUser(null);
      setLoading(false);
      return { success: true };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    
    if (error) {
      setError({ message: error.message });
      return { error: true };
    }
    
    return { error: false };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      setError({ message: error.message });
      return { error: true };
    }
    
    return { error: false };
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!adminUser && user) {return true;}
    
    if (!adminUser) {return false;}
    if (adminUser.role === 'super_admin') {return true;}
    
    const resourcePermissions = adminUser.permissions[resource];
    return resourcePermissions && resourcePermissions.includes(action);
  };

  return { 
    user, 
    adminUser,
    loading, 
    error,
    signInWithEmail, 
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    hasPermission,
    clearError: () => setError(null)
  };
};