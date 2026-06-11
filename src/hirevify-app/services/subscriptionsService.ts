/**
 * Subscriptions Service
 * Handles subscription and premium access from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

class SubscriptionsService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get subscription for a user
   */
  async getUserSubscription(userId: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single<Subscription>();

    if (error) {
      // No subscription found, or table doesn't exist - return free tier default
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.code === '42P01') {
        return {
          data: {
            id: userId,
            user_id: userId,
            tier: 'free',
            status: 'active',
            expires_at: null,
            trial_ends_at: null,
            auto_renew: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Subscription,
          error: null,
        };
      }
      console.error('Error fetching subscription:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Create or update subscription
   */
  async upsertSubscription(userId: string, subscription: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .upsert([{ ...subscription, user_id: userId }], {
        onConflict: 'user_id',
      })
      .select()
      .single<Subscription>();

    if (error) {
      console.error('Error upserting subscription:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Check if user has active premium subscription
   */
  async hasPremiumAccess(userId: string) {
    const { data, error } = await this.getUserSubscription(userId);

    if (error) {
      return { hasPremium: false, error };
    }

    const now = new Date();
    const isActive =
      data &&
      (data.tier === 'pro' || data.tier === 'enterprise') &&
      (data.status === 'active' || data.status === 'past_due') &&
      (!data.expires_at || new Date(data.expires_at) > now);

    return { hasPremium: !!isActive, subscription: data, error: null };
  }

  /**
   * Check if user is in trial period
   */
  async isInTrial(userId: string) {
    const { data, error } = await this.getUserSubscription(userId);

    if (error || !data) {
      return { inTrial: false, error };
    }

    const now = new Date();
    const inTrial =
      data.tier === 'pro' &&
      data.trial_ends_at &&
      new Date(data.trial_ends_at) > now;

    return { inTrial: !!inTrial, trialEndsAt: data.trial_ends_at, error: null };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        auto_renew: false,
      })
      .eq('user_id', userId)
      .select()
      .single<Subscription>();

    if (error) {
      console.error('Error canceling subscription:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Upgrade subscription tier
   */
  async upgradeSubscription(userId: string, newTier: 'pro' | 'enterprise') {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({
        tier: newTier,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single<Subscription>();

    if (error) {
      console.error('Error upgrading subscription:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Get subscription tier name
   */
  getTierName(tier: 'free' | 'pro' | 'enterprise') {
    const tierNames = {
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
    };
    return tierNames[tier];
  }

  /**
   * Get features for tier
   */
  getTierFeatures(tier: 'free' | 'pro' | 'enterprise') {
    const features = {
      free: [
        'Post up to 5 jobs/month',
        'Apply to 5 projects/month',
        'Basic profile',
        'Limited job search',
      ],
      pro: [
        'Unlimited job postings',
        'Unlimited applications',
        'Advanced profile',
        'AI-powered matching',
        'Video interviews',
        'Custom assessments',
        'Analytics & insights',
        'Priority support',
      ],
      enterprise: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integrations',
        'API access',
        'Team management',
        'Advanced analytics',
        'Custom branding',
        '24/7 support',
      ],
    };
    return features[tier];
  }
}

export const subscriptionsService = new SubscriptionsService();
