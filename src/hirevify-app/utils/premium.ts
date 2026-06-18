// Premium Features Access Control System
import { useAuth } from '../components/AuthProvider';
import { useMemo, useCallback } from 'react';

export interface SubscriptionStatus {
 isActive: boolean;
 tier: 'free' | 'pro' | 'enterprise';
 expiresAt: string | null;
 trialEndsAt: string | null;
}

// Define premium features by category
export const PREMIUM_FEATURES = {
 // Recruiter Premium Features
 'ai-matching': {
 name: 'AI Matching Dashboard',
 description: 'Advanced AI-powered candidate matching with compatibility scoring',
 requiredTier: 'pro',
 userType: 'recruiter'
 },
 'ats-scanner': {
 name: 'ATS Resume Scanner',
 description: 'Automated resume screening and ATS compatibility checking',
 requiredTier: 'pro', 
 userType: 'recruiter'
 },
 'advanced-analytics': {
 name: 'Advanced Analytics',
 description: 'Comprehensive hiring metrics, diversity insights, and ROI analysis',
 requiredTier: 'pro',
 userType: 'recruiter'
 },
 'custom-assessments': {
 name: 'Custom Assessment Builder',
 description: 'Create tailored technical assessments and coding challenges',
 requiredTier: 'pro',
 userType: 'recruiter'
 },
 'enhanced-video-interviews': {
 name: 'Enhanced Video Interviews',
 description: 'AI-powered video interview analysis and candidate evaluation',
 requiredTier: 'pro',
 userType: 'recruiter'
 },
 'candidate-search': {
 name: 'Advanced Candidate Search',
 description: 'AI-enhanced candidate discovery and talent pool access',
 requiredTier: 'pro',
 userType: 'recruiter'
 },
 'integrations': {
 name: 'Third-party Integrations',
 description: 'Connect with popular HR tools, CRMs, and job boards',
 requiredTier: 'pro',
 userType: 'recruiter'
 },

 // Candidate Premium Features
 'ai-resume-builder': {
 name: 'AI Resume Builder',
 description: 'AI-powered resume optimization with ATS scanning and smart suggestions',
 requiredTier: 'pro',
 userType: 'candidate'
 },
 'portfolio-premium': {
 name: 'Premium Portfolio Features',
 description: 'Advanced portfolio customization and analytics',
 requiredTier: 'pro',
 userType: 'candidate'
 },
 'ai-skills-development': {
 name: 'AI Skills Development',
 description: 'Personalized learning paths and skill gap analysis',
 requiredTier: 'pro',
 userType: 'candidate'
 },
 'ai-career-advisor': {
 name: 'AI Career Advisor',
 description: 'Personalized career guidance and opportunity recommendations',
 requiredTier: 'pro',
 userType: 'candidate'
 },
 'enhanced-project-search': {
 name: 'Enhanced Project Search',
 description: 'Advanced filtering and AI-powered project recommendations',
 requiredTier: 'pro',
 userType: 'candidate'
 }
} as const;

export type PremiumFeatureKey = keyof typeof PREMIUM_FEATURES;

// Testing account domains - these get full premium access
const TESTING_DOMAINS = [
 'test.hirevify.com',
 'demo.hirevify.com',
 'internal.hirevify.com'
];

// Test user emails - these get full premium access
const TEST_USER_EMAILS = [
 'test@hirevify.com',
 'demo@hirevify.com',
 'admin@hirevify.com',
 'recruiter@test.com',
 'candidate@test.com'
];

// Cache for subscription status to prevent repeated calculations
let subscriptionCache: { email?: string; status: SubscriptionStatus; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Get user's subscription status with caching
 * For now, we'll simulate this with localStorage or test accounts
 * In production, this would fetch from the backend/payment provider
 */
export const getSubscriptionStatus = (userEmail?: string): SubscriptionStatus => {
 try {
 // Check cache first
 if (subscriptionCache && 
 subscriptionCache.email === userEmail && 
 Date.now() - subscriptionCache.timestamp < CACHE_DURATION) {
 return subscriptionCache.status;
 }

 // Check if it's a testing account
 if (userEmail) {
 const domain = userEmail.split('@')[1];
 if (TESTING_DOMAINS.includes(domain) || TEST_USER_EMAILS.includes(userEmail.toLowerCase())) {
 const status = {
 isActive: true,
 tier: 'pro' as const,
 expiresAt: null, // Never expires for test accounts
 trialEndsAt: null
 };
 
 // Cache the result
 subscriptionCache = { email: userEmail, status, timestamp: Date.now() };
 return status;
 }
 }

 // Check localStorage for subscription status (for testing purposes)
 const storedSubscription = localStorage.getItem('hirevify_subscription');
 if (storedSubscription) {
 try {
 const parsed = JSON.parse(storedSubscription);
 const status = {
 isActive: parsed.isActive || false,
 tier: parsed.tier || 'free',
 expiresAt: parsed.expiresAt || null,
 trialEndsAt: parsed.trialEndsAt || null
 };
 
 // Cache the result
 subscriptionCache = { email: userEmail, status, timestamp: Date.now() };
 return status;
 } catch (error) {
 console.error('Error parsing stored subscription:', error);
 }
 }

 // Default to free tier
 const status = {
 isActive: false,
 tier: 'free' as const,
 expiresAt: null,
 trialEndsAt: null
 };
 
 // Cache the result
 subscriptionCache = { email: userEmail, status, timestamp: Date.now() };
 return status;
 } catch (error) {
 console.error('Error getting subscription status:', error);
 // Return safe fallback
 return {
 isActive: false,
 tier: 'free',
 expiresAt: null,
 trialEndsAt: null
 };
 }
};

/**
 * Check if user has access to a premium feature
 */
export const hasPremiumAccess = (
 featureKey: PremiumFeatureKey, 
 userEmail?: string,
 userType?: 'recruiter' | 'candidate'
): boolean => {
 const feature = PREMIUM_FEATURES[featureKey];
 
 // Check if feature exists and user type matches
 if (!feature || (userType && feature.userType!== userType)) {
 return false;
 }

 const subscription = getSubscriptionStatus(userEmail);
 
 // If it's a test account, grant access
 if (userEmail) {
 const domain = userEmail.split('@')[1];
 if (TESTING_DOMAINS.includes(domain) || TEST_USER_EMAILS.includes(userEmail.toLowerCase())) {
 return true;
 }
 }

 // Check subscription status
 if (!subscription.isActive) {
 return false;
 }

 // Check tier requirements
 const tierHierarchy = { 'free': 0, 'pro': 1, 'enterprise': 2 };
 const userTierLevel = tierHierarchy[subscription.tier];
 const requiredTierLevel = tierHierarchy[feature.requiredTier];

 return userTierLevel >= requiredTierLevel;
};

/**
 * Custom hook for premium feature access with memoization
 */
export const usePremiumAccess = () => {
 const { user } = useAuth();
 
 // Memoize expensive calculations
 const isTestAccount = useMemo(() => {
 if (!user?.email) return false;
 const domain = user.email.split('@')[1];
 return TESTING_DOMAINS.includes(domain) || TEST_USER_EMAILS.includes(user.email.toLowerCase());
 }, [user?.email]);

 const subscription = useMemo(() => {
 return getSubscriptionStatus(user?.email);
 }, [user?.email]);

 const checkAccess = useCallback((featureKey: PremiumFeatureKey): boolean => {
 return hasPremiumAccess(featureKey, user?.email, user?.userType);
 }, [user?.email, user?.userType]);

 const getSubscription = useCallback((): SubscriptionStatus => {
 return subscription;
 }, [subscription]);

 const getFeatureInfo = useCallback((featureKey: PremiumFeatureKey) => {
 return PREMIUM_FEATURES[featureKey];
 }, []);

 return {
 checkAccess,
 getSubscription,
 getFeatureInfo,
 isTestAccount
 };
};

/**
 * Utility to set subscription status for testing
 */
export const setTestSubscription = (tier: 'free' | 'pro' | 'enterprise') => {
 const subscription = {
 isActive: tier!== 'free',
 tier,
 expiresAt: tier!== 'free'? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(): null,
 trialEndsAt: null
 };

 localStorage.setItem('hirevify_subscription', JSON.stringify(subscription));
 console.log('Test subscription set to:', tier);
};

/**
 * Utility to clear subscription status
 */
export const clearTestSubscription = () => {
 localStorage.removeItem('hirevify_subscription');
 console.log('Test subscription cleared');
};






