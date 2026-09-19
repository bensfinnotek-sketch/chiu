// Subscription and Usage Service for HanziAI Speaking

export type UserPlanType = 'free' | 'pro' | 'vip';

export interface UserSubscription {
  plan: UserPlanType;
  dailyMinutesLimit: number;
  minutesUsedToday: number;
  lastUsedDate: string;
}

const STORAGE_KEY = 'hanzi_ai_subscription';

class SubscriptionService {
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  public getSubscription(): UserSubscription {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UserSubscription = JSON.parse(stored);
        if (parsed.lastUsedDate !== this.getTodayString()) {
          parsed.minutesUsedToday = 0;
          parsed.lastUsedDate = this.getTodayString();
          this.saveSubscription(parsed);
        }
        return parsed;
      }
    } catch {
      // fallback
    }

    const initial: UserSubscription = {
      plan: 'free',
      dailyMinutesLimit: 30, // 30 mins free daily speaking allowance for optimal practice
      minutesUsedToday: 4,
      lastUsedDate: this.getTodayString(),
    };
    this.saveSubscription(initial);
    return initial;
  }

  public saveSubscription(sub: UserSubscription): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
    } catch {
      // ignore
    }
  }

  public getUserPlan(): UserPlanType {
    return this.getSubscription().plan;
  }

  public getRemainingMinutes(): number {
    const sub = this.getSubscription();
    if (sub.plan === 'vip' || sub.plan === 'pro') return 999;
    return Math.max(0, sub.dailyMinutesLimit - sub.minutesUsedToday);
  }

  public canUseSpeaking(): boolean {
    return this.getRemainingMinutes() > 0;
  }

  public addUsage(minutes: number): void {
    const sub = this.getSubscription();
    sub.minutesUsedToday += Math.max(1, Math.round(minutes));
    sub.lastUsedDate = this.getTodayString();
    this.saveSubscription(sub);
  }
}

export const subscriptionService = new SubscriptionService();
