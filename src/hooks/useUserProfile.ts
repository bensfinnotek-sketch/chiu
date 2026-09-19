import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { UserProfile } from '../types/user';
import { getUserRepository } from '../services/repositories/repositoryFactory';
import { createInitialUserProfile } from '../config/defaultUserProfile';

export function useUserProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      // Guest profile fallback
      const guestProf = createInitialUserProfile('guest_user', 'guest@hanziai.app', 'Khách học viên');
      setProfile(guestProf);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const repo = getUserRepository(user);
      let p = await repo.getProfile(user.id);
      if (!p) {
        // First login: auto create profile
        p = createInitialUserProfile(user.id, user.email, user.displayName, user.avatarUrl);
        await repo.createProfile(p);
      }
      setProfile(p);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err?.message || 'Không thể tải thông tin hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      if (!user) {
        // Update local guest
        const updated = { ...(profile || createInitialUserProfile('guest_user', 'guest@hanziai.app')), ...updates, updatedAt: new Date().toISOString() };
        setProfile(updated);
        return updated;
      }
      const repo = getUserRepository(user);
      const res = await repo.updateProfile(user.id, updates);
      setProfile(res);
      return res;
    },
    [user, profile]
  );

  return {
    profile,
    isLoading: authLoading || isLoading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}
