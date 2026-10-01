import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;
if (url && anonKey) {
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

export const authService = {
  configured: Boolean(client),
  getSession: async (): Promise<Session | null> => {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session;
  },
  onAuthStateChange: (listener: (session: Session | null) => void) => {
    if (!client) return () => undefined;
    const { data } = client.auth.onAuthStateChange((_event, session) => listener(session));
    return () => data.subscription.unsubscribe();
  },
  async signUp(email: string, password: string, displayName: string) {
    if (!client) throw new Error('Đăng nhập tài khoản chưa được cấu hình.');
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
    if (error) throw error;
    return data;
  },
  async signIn(email: string, password: string) {
    if (!client) throw new Error('Đăng nhập tài khoản chưa được cấu hình.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signInWithGoogle() {
    if (!client) throw new Error('Google login chưa được cấu hình.');
    const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) throw error;
    return data;
  },
  async signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },
  async resetPassword(email: string) {
    if (!client) throw new Error('Đăng nhập tài khoản chưa được cấu hình.');
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: window.location.origin }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Không thể gửi email đặt lại mật khẩu.');
  },
  async deleteAccount() {
    if (!client) throw new Error('Đăng nhập tài khoản chưa được cấu hình.');
    const session = await authService.getSession();
    if (!session?.access_token) throw new Error('Phiên đăng nhập đã hết hạn.');
    const response = await fetch('/api/auth/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Không thể xóa tài khoản.');
    await client.auth.signOut();
  },
};
