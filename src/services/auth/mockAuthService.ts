import { AuthService } from './authService';
import { AuthUser } from '../../types/auth';

const MOCK_USER_STORAGE_KEY = 'hanzi_ai_mock_auth_user';

export class MockAuthService implements AuthService {
  private listeners: Array<(user: AuthUser | null) => void> = [];

  private getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private setStoredUser(user: AuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(MOCK_USER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    this.listeners.forEach((fn) => fn(user));
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const mockUser: AuthUser = {
      id: 'mock-google-user-1',
      email: 'learner.google@hanziai.app',
      displayName: 'Minh Google',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      provider: 'google',
    };
    this.setStoredUser(mockUser);
    return mockUser;
  }

  async signInWithEmail(email: string, _password: string): Promise<AuthUser> {
    const mockUser: AuthUser = {
      id: `mock-email-user-${btoa(email).substring(0, 8)}`,
      email,
      displayName: email.split('@')[0] || 'Learner',
      provider: 'email',
    };
    this.setStoredUser(mockUser);
    return mockUser;
  }

  async signUpWithEmail(email: string, _password: string): Promise<AuthUser> {
    const mockUser: AuthUser = {
      id: `mock-email-user-${btoa(email).substring(0, 8)}`,
      email,
      displayName: email.split('@')[0] || 'Learner',
      provider: 'email',
    };
    this.setStoredUser(mockUser);
    return mockUser;
  }

  async signOut(): Promise<void> {
    this.setStoredUser(null);
  }

  async resetPassword(_email: string): Promise<void> {
    // Simulated successful password reset email sent
    return new Promise((resolve) => setTimeout(resolve, 600));
  }

  async updatePassword(_newPassword: string): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 600));
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.getStoredUser();
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    // Notify with current stored state
    callback(this.getStoredUser());
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }
}
