// Testing Premium Access Override
// This file provides a way to bypass premium checks during testing

import { PremiumFeatureKey, PREMIUM_FEATURES, SubscriptionStatus } from './premium';

// Testing mode flag - set to true to bypass all premium restrictions
export const TESTING_MODE = true;

/**
 * Testing version of premium access that always grants access when testing mode is enabled
 */
export const getTestingPremiumAccess = () => {
 const alwaysTrue = () => true;
 
 const getTestingSubscription = (): SubscriptionStatus => ({
 isActive: true,
 tier: 'pro',
 expiresAt: null,
 trialEndsAt: null
 });

 const getFeatureInfo = (featureKey: PremiumFeatureKey) => {
 return PREMIUM_FEATURES[featureKey];
 };

 if (TESTING_MODE) {
 return {
 checkAccess: alwaysTrue,
 getSubscription: getTestingSubscription,
 getFeatureInfo,
 isTestAccount: true
 };
 }

 // If not in testing mode, fallback to original implementation
 return null;
};

/**
 * Simple function to check if we're in testing mode
 */
export const isTestingMode = () => TESTING_MODE;

/**
 * Log testing mode status for debugging
 */
export const logTestingStatus = () => {
 if (TESTING_MODE) {
 console.log(' TESTING MODE: Premium features are unlocked for testing');
 } else {
 console.log(' PRODUCTION MODE: Premium access controls are active');
 }
};






