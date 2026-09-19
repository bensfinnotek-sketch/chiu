import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SubscriptionInfo } from '../types/user';
import { supabase, isSupabaseConfigured } from '../database/supabaseClient';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSub() {
      if (!user || !isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setSubscription(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (isMounted) {
          if (data) {
            setSubscription({
              userId: data.user_id,
              plan: data.plan as any,
              status: data.status as any,
              currentPeriodEnd: data.current_period_end,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            });
          } else {
            setSubscription(null);
          }
        }
      } catch (e) {
        console.warn('Subscription fetch error:', e);
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
  };
}
