import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SubscriptionInfo } from '../types/user';
import { supabase, isSupabaseConfigured } from '../database/supabaseClient';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSub() {
      if (!user || !isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setSubscription(null);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (queryError) {
          throw new Error(`Không thể tải gói tài khoản: ${queryError.message}`);
        }

        if (isMounted) {
          setSubscription(
            data
              ? {
                  userId: data.user_id,
                  plan: data.plan as SubscriptionInfo['plan'],
                  status: data.status as SubscriptionInfo['status'],
                  currentPeriodEnd: data.current_period_end,
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                }
              : null
          );
        }
      } catch (e: any) {
        console.warn('Subscription fetch error:', e);
        if (isMounted) {
          setSubscription(null);
          setError(e?.message || 'Không thể tải thông tin gói tài khoản.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSub();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const isPremium = subscription?.plan === 'premium' && subscription.status === 'active';

  return {
    subscription,
    isPremium,
    isLoading,
    error,
  };
}
