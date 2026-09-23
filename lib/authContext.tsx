'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    pass: string,
    fullName: string,
    callsign?: string,
    role?: UserRole
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsDemoMode(!configured);

    if (configured && supabase) {
      // 1. Check existing Supabase cloud session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setRole('viewer');
          setIsLoading(false);
        }
      });

      // 2. Listen to Supabase cloud auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await fetchSupabaseProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setRole('viewer');
        }
        setIsLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      // Local session check if user registered their own custom account
      const savedUser = localStorage.getItem('tactical_active_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as UserProfile;
          setUser(parsed);
          setRole(parsed.role || 'operator');
        } catch {
          setUser(null);
          setRole('viewer');
        }
      } else {
        setUser(null);
        setRole('viewer');
      }
      setIsLoading(false);
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const activeProfile: UserProfile = {
          id: data.id,
          email: data.email,
          full_name: data.full_name || email.split('@')[0],
          callsign: data.callsign || 'OPERATOR',
          role: data.role as UserRole,
          avatar_url: data.avatar_url,
        };
        setUser(activeProfile);
        setRole(data.role as UserRole);
      } else {
        const fallbackProfile: UserProfile = {
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          callsign: 'OPERATOR',
          role: 'operator',
        };
        setUser(fallbackProfile);
        setRole('operator');
      }
    } catch (e) {
      console.error('Error fetching Supabase user profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data?.user) {
          await fetchSupabaseProfile(data.user.id, data.user.email || '');
        }
        return {};
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || 'Authentication failed' };
      }
    } else {
      // Local custom account verification (no demo accounts)
      const registeredUsersRaw = localStorage.getItem('tactical_registered_users');
      const registeredUsers: Array<{ email: string; pass: string; profile: UserProfile }> =
        registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];

      const match = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.pass === pass
      );

      if (match) {
        setUser(match.profile);
        setRole(match.profile.role);
        localStorage.setItem('tactical_active_user', JSON.stringify(match.profile));
        setIsLoading(false);
        return {};
      }

      setIsLoading(false);
      return {
        error:
          registeredUsers.length > 0
            ? 'Invalid email or password.'
            : 'No account found. Please click "Register Operator" to create your account or connect Supabase in .env.local.',
      };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    fullName: string,
    callsign: string = 'OPERATOR',
    desiredRole: UserRole = 'operator'
  ): Promise<{ error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              full_name: fullName,
              callsign: callsign,
              role: desiredRole,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data?.user) {
          if (!data.session) {
            setIsLoading(false);
            return {
              error:
                'Account registered in Supabase! If you cannot log in, please check your email to confirm your account, or turn off "Confirm email" in your Supabase Auth settings.',
            };
          }
          await fetchSupabaseProfile(data.user.id, data.user.email || '');
        }
        return {};
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || 'Registration failed' };
      }
    } else {
      // Register custom user locally
      const registeredUsersRaw = localStorage.getItem('tactical_registered_users');
      const registeredUsers: Array<{ email: string; pass: string; profile: UserProfile }> =
        registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];

      if (registeredUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        setIsLoading(false);
        return { error: 'An account with this email address already exists.' };
      }

      const newProfile: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email: email.trim(),
        full_name: fullName.trim() || email.split('@')[0],
        callsign: callsign.trim() || 'OPERATOR',
        role: desiredRole,
      };

      registeredUsers.push({ email: email.trim(), pass, profile: newProfile });
      localStorage.setItem('tactical_registered_users', JSON.stringify(registeredUsers));
      localStorage.setItem('tactical_active_user', JSON.stringify(newProfile));

      setUser(newProfile);
      setRole(newProfile.role);
      setIsLoading(false);
      return {};
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    localStorage.removeItem('tactical_active_user');
    localStorage.removeItem('tactical_demo_role');

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }

    setUser(null);
    setRole('viewer');
    setIsLoading(false);
  };

  const isAuthenticated = Boolean(user);
  const canEdit = isAuthenticated && (role === 'admin' || role === 'operator');
  const canDelete = isAuthenticated && role === 'admin';
  const isAdmin = isAuthenticated && role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        isDemoMode,
        canEdit,
        canDelete,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
