import { AuthService } from './authService';
import { AuthUser } from '../../types/auth';
import { supabase } from '../../database/supabaseClient';

export class SupabaseAuthService implements AuthService {
  async signInWithGoogle(): Promise<AuthUser> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) throw error;
    // OAuth will redirect, but if session exists:
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return {
        id: 'pending-redirect',
        email: '',
        provider: 'google',
      };
    }
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url,
      provider: 'google',
    };
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from login');
    return {
      id: data.user.id,
      email: data.user.email || '',
      displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url,
      provider: 'email',
    };
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthUser> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from registration');
    return {
      id: data.user.id,
      email: data.user.email || '',
      displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url,
      provider: 'email',
    };
  }

  async signOut(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email || '',
      displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url,
      provider: (data.user.app_metadata?.provider as any) || 'email',
    };
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    if (!supabase) {
      callback(null);
      return () => {};
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
          provider: (session.user.app_metadata?.provider as any) || 'email',
        });
      } else {
        callback(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }
}
