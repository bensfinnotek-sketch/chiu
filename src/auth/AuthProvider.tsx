import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthUser, AuthState } from '../types/auth';
import { AuthService } from '../services/auth/authService';
import { SupabaseAuthService } from '../services/auth/supabaseAuthService';
import { MockAuthService } from '../services/auth/mockAuthService';
import { isSupabaseConfigured } from '../database/supabaseClient';

interface AuthContextType extends AuthState {
  isMockMode: boolean;
  signInWithGoogle: () => Promise<AuthUser>;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Instantiate proper service based on Supabase configuration
const authService: AuthService = isSupabaseConfigured
  ? new SupabaseAuthService()
  : new MockAuthService();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    // Keep guest mode explicit, but never let a stale guest flag hide an
    // already-restored authenticated session during startup.
    return localStorage.getItem('hanzi_ai_is_guest') === 'true';
  });

  const isMockMode = !isSupabaseConfigured;

  useEffect(() => {
    // Initial user resolution
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsGuest(false);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to changes
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      if (newUser) {
        setIsGuest(false);
        localStorage.removeItem('hanzi_ai_is_guest');
        localStorage.removeItem('hanzi_guest_speaking_started_at');
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const authed = await authService.signInWithGoogle();
      setUser(authed);
      setIsGuest(false);
      localStorage.removeItem('hanzi_ai_is_guest');
      localStorage.removeItem('hanzi_guest_speaking_started_at');
      return authed;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const authed = await authService.signInWithEmail(email, pass);
      setUser(authed);
      setIsGuest(false);
      localStorage.removeItem('hanzi_ai_is_guest');
      return authed;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const authed = await authService.signUpWithEmail(email, pass);
      setUser(authed);
      setIsGuest(false);
      localStorage.removeItem('hanzi_ai_is_guest');
      return authed;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      localStorage.removeItem('hanzi_guest_speaking_started_at');
      setIsGuest(true);
      localStorage.setItem('hanzi_ai_is_guest', 'true');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return authService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPass: string) => {
    return authService.updatePassword(newPass);
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hanzi_guest_speaking_started_at');
    setIsGuest(true);
    localStorage.setItem('hanzi_ai_is_guest', 'true');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user ? { user } : null,
        isLoading,
        isAuthenticated: Boolean(user),
        isGuest,
        isMockMode,
        signInWithGoogle,
        signInWithEmail,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
