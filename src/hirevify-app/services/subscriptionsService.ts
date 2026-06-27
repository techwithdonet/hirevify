/**
 * Subscriptions Service
 * Handles subscription and premium access from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export interface Subscription {
 id: string;
 user_id: string;
 tier: 'free' | 'pro';
 status: 'active' | 'past_due' | 'canceled' | 'expired' | 'frozen';
 stripe_subscription_id: string | null;
 stripe_customer_id: string | null;
 started_at: string;
 expires_at: string | null;
 trial_ends_at: string | null;
 auto_renew: boolean;
 freeze_used?: boolean | null;
 frozen_at?: string | null;
 frozen_remaining_days?: number | null;
  created_at: string;
  updated_at: string;
}

class SubscriptionsService {
 private supabase = createSupabaseBrowserClient();

 private freeSubscription(userId: string): Subscription {
 return {
 id: userId,
 user_id: userId,
 tier: 'free',
 status: 'active',
 stripe_subscription_id: null,
 stripe_customer_id: null,
 started_at: new Date().toISOString(),
 expires_at: null,
 trial_ends_at: null,
 auto_renew: false,
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 };
 }

 /**
 * Get subscription for a user
 */
 async getUserSubscription(userId: string) {
 const { data, error } = await this.supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle<Subscription>();

 if (error) {
 return { data: this.freeSubscription(userId), error: null };
 }

 return { data: data || this.freeSubscription(userId), error: null };
 }

 /**
 * Create or update subscription
 */
 async upsertSubscription(userId: string, subscription: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>) {
 const { data, error } = await this.supabase.from('subscriptions').upsert([{...subscription, user_id: userId }], {
 onConflict: 'user_id',
 }).select().single<Subscription>();

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
 data.tier === 'pro' &&
 (data.status === 'active' || data.status === 'past_due' || data.status === 'canceled') &&
 (!data.expires_at || new Date(data.expires_at) > now);

 return { hasPremium:!!isActive, subscription: data, error: null };
 }

 /**
 * Check if user is in trial period
 */
 async isInTrial(userId: string) {
 const { data, error } = await this.getUserSubscription(userId);

 if (error ||!data) {
 return { inTrial: false, error };
 }

 const now = new Date();
 const inTrial =
 data.tier === 'pro' &&
 data.trial_ends_at &&
 new Date(data.trial_ends_at) > now;

 return { inTrial:!!inTrial, trialEndsAt: data.trial_ends_at, error: null };
 }

 /**
 * Cancel subscription
 */
 async cancelSubscription(userId: string) {
 const { data, error } = await this.supabase.from('subscriptions').update({
 status: 'canceled',
 auto_renew: false,
 }).eq('user_id', userId).select().single<Subscription>();

 if (error) {
 console.error('Error canceling subscription:', error);
 return { data: null, error };
 }

 return { data, error: null };
 }

 async freezeSubscription(userId: string) {
 const { data: subscription } = await this.getUserSubscription(userId);

 if (!subscription || subscription.tier === 'free') {
 return { data: null, error: new Error('Only active paid subscriptions can be frozen.') };
 }

 if (subscription.status === 'canceled') {
 return { data: null, error: new Error('Canceled subscriptions cannot be frozen.') };
 }

 if (subscription.status === 'frozen') {
 return { data: subscription, error: null };
 }

 if (subscription.freeze_used) {
 return { data: null, error: new Error('This subscription has already used its one freeze.') };
 }

 const expiresAt = subscription.expires_at ? new Date(subscription.expires_at).getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000;
 const remainingDays = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));

 if (remainingDays <= 0) {
 return { data: null, error: new Error('This subscription has no remaining days to freeze.') };
 }

 const { data, error } = await this.supabase.from('subscriptions').update({
 status: 'frozen',
 auto_renew: false,
 freeze_used: true,
 frozen_at: new Date().toISOString(),
 frozen_remaining_days: remainingDays,
 }).eq('user_id', userId).select().single<Subscription>();

 if (error) {
 return { data: null, error };
 }

 return { data, error: null };
 }

 async unfreezeSubscription(userId: string) {
 const { data: subscription } = await this.getUserSubscription(userId);

 if (!subscription || subscription.status !== 'frozen') {
 return { data: null, error: new Error('Only frozen subscriptions can be unfrozen.') };
 }

 const remainingDays = Math.max(1, Number(subscription.frozen_remaining_days || 0));
 const expiresAt = new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000).toISOString();

 const { data, error } = await this.supabase.from('subscriptions').update({
 status: 'active',
 expires_at: expiresAt,
 frozen_at: null,
 frozen_remaining_days: null,
 }).eq('user_id', userId).select().single<Subscription>();

 if (error) {
 return { data: null, error };
 }

 return { data, error: null };
 }

 /**
 * Upgrade subscription tier
 */
 async upgradeSubscription(userId: string, newTier: 'pro') {
 const expiresAt = new Date();
 expiresAt.setFullYear(expiresAt.getFullYear() + 1);

 const { data, error } = await this.supabase.from('subscriptions').update({
 tier: newTier,
 status: 'active',
 expires_at: expiresAt.toISOString(),
 }).eq('user_id', userId).select().single<Subscription>();

 if (error) {
 console.error('Error upgrading subscription:', error);
 return { data: null, error };
 }

 return { data, error: null };
 }

 /**
 * Get subscription tier name
 */
 getTierName(tier: 'free' | 'pro') {
 const tierNames = {
 free: 'Free',
 pro: 'Pro',
 };
 return tierNames[tier];
 }

 /**
 * Get features for tier
 */
 getTierFeatures(tier: 'free' | 'pro') {
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
 };
 return features[tier];
 }
}

export const subscriptionsService = new SubscriptionsService();


