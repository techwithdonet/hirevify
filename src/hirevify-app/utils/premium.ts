"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { subscriptionsService } from "../services/subscriptionsService";

export interface SubscriptionStatus {
  isActive: boolean;
  tier: "free" | "pro";
  expiresAt: string | null;
  trialEndsAt: string | null;
}

export const PREMIUM_FEATURES = {
  "ai-matching": {
    name: "AI Matching Dashboard",
    description: "AI-powered candidate matching and compatibility scoring.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "ats-scanner": {
    name: "Recruiter ATS Scanner",
    description: "Automated resume screening and ATS compatibility analysis.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "automated-screening": {
    name: "Automated Screening",
    description: "Automated screening rules, ranking, and review workflows.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "advanced-analytics": {
    name: "Advanced Analytics",
    description: "Hiring metrics, funnel analysis, and operational insights.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "custom-assessments": {
    name: "Custom Assessment Builder",
    description: "Create tailored assessments and technical challenges.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "enhanced-video-interviews": {
    name: "Enhanced Video Interviews",
    description: "Structured video interview and candidate evaluation tools.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "candidate-search": {
    name: "Advanced Candidate Search",
    description: "Search, filter, and save candidates from the talent pool.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "market-intelligence-recruiter": {
    name: "Recruiting Market Intelligence",
    description: "Market, skill-demand, and talent availability insights.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  integrations: {
    name: "Third-party Integrations",
    description: "Connect supported HR tools and recruiting services.",
    requiredTier: "pro",
    userType: "recruiter",
  },
  "ai-resume-builder": {
    name: "AI Resume Builder",
    description: "AI writing, parsing, ATS analysis, and resume optimization.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "candidate-ats-scanner": {
    name: "Candidate ATS Scanner",
    description: "Analyze a resume against a target role and optimize its match.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "enhanced-video-interviews-candidate": {
    name: "Enhanced Video Interview Practice",
    description: "Structured video practice and interview review tools.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "portfolio-premium": {
    name: "Portfolio Pro",
    description: "Advanced portfolio customization and performance insights.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "ai-skills-development": {
    name: "AI Skills Development",
    description: "Personalized learning paths and skill-gap guidance.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "ai-career-advisor": {
    name: "AI Career Advisor",
    description: "Personalized career guidance and opportunity recommendations.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "ai-interview-coach": {
    name: "AI Interview Coach",
    description: "Guided interview practice and evidence-based feedback.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "market-intelligence-candidate": {
    name: "Career Market Intelligence",
    description: "Skill-demand, role, and career market insights.",
    requiredTier: "pro",
    userType: "candidate",
  },
  "enhanced-project-search": {
    name: "Enhanced Project Search",
    description: "Advanced filters and personalized project recommendations.",
    requiredTier: "pro",
    userType: "candidate",
  },
} as const;

export type PremiumFeatureKey = keyof typeof PREMIUM_FEATURES;

export const PREMIUM_ENABLED = true;
export const TEMPORARY_PREMIUM_ADMIN_ENABLED = true;
const DEVELOPMENT_OVERRIDE_ENABLED = process.env.NODE_ENV === "development";
const STORAGE_KEY = "hirevify_subscription";

const FREE_SUBSCRIPTION: SubscriptionStatus = {
  isActive: false,
  tier: "free",
  expiresAt: null,
  trialEndsAt: null,
};

function normalizeStoredSubscription(value: unknown): SubscriptionStatus {
  if (!value || typeof value !== "object") return FREE_SUBSCRIPTION;
  const record = value as Record<string, unknown>;
  const tier = record.tier === "pro" ? "pro" : "free";
  const expiresAt = typeof record.expiresAt === "string" ? record.expiresAt : null;
  const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
  return {
    isActive: tier === "pro" && record.isActive === true && !isExpired,
    tier,
    expiresAt,
    trialEndsAt: typeof record.trialEndsAt === "string" ? record.trialEndsAt : null,
  };
}

export function getSubscriptionStatus(): SubscriptionStatus {
  if (!DEVELOPMENT_OVERRIDE_ENABLED || typeof window === "undefined") {
    return FREE_SUBSCRIPTION;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeStoredSubscription(JSON.parse(stored)) : FREE_SUBSCRIPTION;
  } catch {
    return FREE_SUBSCRIPTION;
  }
}

export function hasPremiumAccess(
  featureKey: PremiumFeatureKey,
  _userEmail?: string,
  userType?: "recruiter" | "candidate",
  subscriptionOverride?: SubscriptionStatus,
) {
  const feature = PREMIUM_FEATURES[featureKey];
  if (!feature || (userType && feature.userType !== userType)) return false;
  if (!PREMIUM_ENABLED) return true;

  const subscription = subscriptionOverride || getSubscriptionStatus();
  return subscription.isActive && subscription.tier === "pro";
}

export function usePremiumAccess() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>(() =>
    getSubscriptionStatus(),
  );
  const [isLoading, setIsLoading] = useState(Boolean(user?.id));

  useEffect(() => {
    let active = true;

    async function loadSubscription() {
      const developmentOverride = getSubscriptionStatus();
      if (developmentOverride.isActive) {
        if (active) {
          setSubscription(developmentOverride);
          setIsLoading(false);
        }
        return;
      }

      if (!user?.id) {
        if (active) {
          setSubscription(FREE_SUBSCRIPTION);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const result = await subscriptionsService.getUserSubscription(user.id);
      if (!active) return;

      const row = result.data;
      const expiresAt = row?.expires_at || null;
      const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
      setSubscription({
        isActive:
          row?.tier === "pro" && row?.status === "active" && !isExpired,
        tier: row?.tier === "pro" ? "pro" : "free",
        expiresAt,
        trialEndsAt: row?.trial_ends_at || null,
      });
      setIsLoading(false);
    }

    void loadSubscription();
    const refresh = () => void loadSubscription();
    window.addEventListener("storage", refresh);
    window.addEventListener("hirevify:premium-change", refresh);
    return () => {
      active = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hirevify:premium-change", refresh);
    };
  }, [user?.id]);

  const checkAccess = useCallback(
    (featureKey: PremiumFeatureKey) =>
      hasPremiumAccess(featureKey, user?.email, user?.userType, subscription),
    [subscription, user?.email, user?.userType],
  );

  const getSubscription = useCallback(() => subscription, [subscription]);
  const getFeatureInfo = useCallback(
    (featureKey: PremiumFeatureKey) => PREMIUM_FEATURES[featureKey],
    [],
  );
  const isTestAccount = useMemo(
    () => DEVELOPMENT_OVERRIDE_ENABLED && getSubscriptionStatus().isActive,
    [subscription],
  );

  return {
    checkAccess,
    getSubscription,
    getFeatureInfo,
    isTestAccount,
    isLoading,
  };
}

export function setTestSubscription(tier: "free" | "pro") {
  if (!DEVELOPMENT_OVERRIDE_ENABLED || typeof window === "undefined") {
    throw new Error("The local premium override is available only in development.");
  }
  const subscription: SubscriptionStatus = {
    isActive: tier === "pro",
    tier,
    expiresAt:
      tier === "pro"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    trialEndsAt: null,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  window.dispatchEvent(new Event("hirevify:premium-change"));
}

export function clearTestSubscription() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("hirevify:premium-change"));
}
