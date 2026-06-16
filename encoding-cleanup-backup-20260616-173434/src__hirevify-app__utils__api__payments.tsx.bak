import { projectId, publicAnonKey } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

// Razorpay-specific interfaces
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpaySubscription {
  id: string;
  planId: string;
  status: 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
  currentStart: number;
  currentEnd: number;
  endedAt?: number;
  chargeAt: number;
  startAt: number;
  authAttempts: number;
  totalCount: number;
  paidCount: number;
  remainingCount: number;
  shortUrl?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  razorpayPlanId: string;
  popular?: boolean;
  description: string;
  discountPercentage?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'netbanking' | 'wallet' | 'upi';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  vpa?: string; // For UPI
  wallet?: string; // For wallet payments
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'pending';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  razorpaySubscriptionId: string;
  nextBillingAt?: number;
  remainingCount?: number;
}

export interface UsageMetrics {
  projectsPosted: number;
  projectsLimit: number;
  candidateSearches: number;
  candidateSearchesLimit: number;
  videoInterviews: number;
  videoInterviewsLimit: number;
  aiAssistantQueries: number;
  aiAssistantQueriesLimit: number;
  storageUsed: number;
  storageLimit: number;
}

export interface RazorpayCheckoutOptions {
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: RazorpayPaymentResponse) => void;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Declare global Razorpay interface for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

export class PaymentsAPI {
  // Initialize Razorpay SDK
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  // Get available subscription plans with Indian pricing
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${API_BASE}/payments/plans`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch subscription plans');
    }

    return result;
  }

  // Create Razorpay order for subscription
  static async createSubscriptionOrder(
    planId: string, 
    accessToken: string
  ): Promise<RazorpayOrder> {
    const response = await fetch(`${API_BASE}/payments/create-subscription-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ planId })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create subscription order');
    }

    return result;
  }

  // Create one-time payment order
  static async createPaymentOrder(
    amount: number,
    currency: string = 'INR',
    accessToken: string,
    metadata?: Record<string, any>
  ): Promise<RazorpayOrder> {
    const response = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ amount, currency, metadata })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create payment order');
    }

    return result;
  }

  // Verify payment and activate subscription
  static async verifyPaymentAndActivateSubscription(
    paymentResponse: RazorpayPaymentResponse,
    planId: string,
    accessToken: string
  ): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/payments/verify-and-activate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        ...paymentResponse,
        planId
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment and activate subscription');
    }

    return result;
  }

  // Verify one-time payment
  static async verifyPayment(
    paymentResponse: RazorpayPaymentResponse,
    accessToken: string
  ): Promise<{ success: boolean; payment: any }> {
    const response = await fetch(`${API_BASE}/payments/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentResponse)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment');
    }

    return result;
  }

  // Get current subscription
  static async getCurrentSubscription(accessToken: string): Promise<Subscription | null> {
    const response = await fetch(`${API_BASE}/payments/subscription`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No subscription found
      }
      throw new Error(result.error || 'Failed to fetch subscription');
    }

    return result;
  }

  // Cancel subscription
  static async cancelSubscription(accessToken: string, immediate = false): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/payments/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ immediate })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to cancel subscription');
    }

    return result;
  }

  // Pause subscription
  static async pauseSubscription(accessToken: string): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/payments/subscription/pause`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to pause subscription');
    }

    return result;
  }

  // Resume subscription
  static async resumeSubscription(accessToken: string): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/payments/subscription/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to resume subscription');
    }

    return result;
  }

  // Change subscription plan
  static async changeSubscriptionPlan(
    newPlanId: string, 
    accessToken: string
  ): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/payments/subscription/change-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ newPlanId })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to change subscription plan');
    }

    return result;
  }

  // Get payment history
  static async getPaymentHistory(accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch payment history');
    }

    return result;
  }

  // Get usage metrics
  static async getUsageMetrics(accessToken: string): Promise<UsageMetrics> {
    const response = await fetch(`${API_BASE}/payments/usage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch usage metrics');
    }

    return result;
  }

  // Check if user has access to feature
  static async checkFeatureAccess(
    feature: string, 
    accessToken: string
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    const response = await fetch(`${API_BASE}/payments/feature-access/${feature}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to check feature access');
    }

    return result;
  }

  // Get invoice details
  static async getInvoice(invoiceId: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE}/payments/invoice/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch invoice');
    }

    return result;
  }

  // Download invoice
  static async downloadInvoice(invoiceId: string, accessToken: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/payments/invoice/${invoiceId}/download`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to download invoice');
    }

    return response.blob();
  }

  // Initiate Razorpay checkout
  static async initiateCheckout(
    order: RazorpayOrder,
    userDetails: { name: string; email: string; contact?: string },
    onSuccess: (response: RazorpayPaymentResponse) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    const scriptLoaded = await this.loadRazorpayScript();
    
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK. Please check your internet connection and try again.');
    }

    const options: RazorpayCheckoutOptions = {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'HireVify',
      description: 'HireVify Subscription Payment',
      prefill: userDetails,
      theme: {
        color: '#14b8a6' // Primary color from design system
      },
      modal: {
        ondismiss: () => {
          onFailure(new Error('Payment cancelled by user'));
        }
      },
      handler: onSuccess
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      onFailure(new Error('Failed to initialize payment. Please try again.'));
    }
  }
}

// Indian subscription plans with Razorpay pricing
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    razorpayPlanId: '',
    description: 'Perfect for getting started with basic features',
    features: [
      '3 project postings per month',
      '10 candidate searches per month',
      'Basic skills assessments',
      'Standard support',
      '100MB file storage'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Professional',
    price: 1999, // â‚¹1,999 per month
    interval: 'month',
    razorpayPlanId: 'plan_pro_monthly_india',
    description: 'Advanced features for growing teams',
    popular: true,
    features: [
      'Unlimited project postings',
      'Unlimited candidate searches',
      'Advanced skills assessments',
      'AI-powered matching',
      'Video interview recording',
      'Priority support',
      '10GB file storage',
      'Advanced analytics',
      'Skills-first hiring tools'
    ]
  },
  {
    id: 'pro-yearly',
    name: 'Professional (Annual)',
    price: 19990, // â‚¹19,990 per year (2 months free)
    interval: 'year',
    razorpayPlanId: 'plan_pro_yearly_india',
    description: 'Best value with 2 months free',
    discountPercentage: 17, // 2 months free = ~17% discount
    features: [
      'Unlimited project postings',
      'Unlimited candidate searches',
      'Advanced skills assessments',
      'AI-powered matching',
      'Video interview recording',
      'Priority support',
      '10GB file storage',
      'Advanced analytics',
      'Skills-first hiring tools',
      '2 months free!'
    ]
  }
];

// Candidate plans with Indian pricing
export const CANDIDATE_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'candidate-free',
    name: 'Free',
    price: 0,
    interval: 'month',
    razorpayPlanId: '',
    description: 'Essential tools for job seekers',
    features: [
      'Basic resume builder',
      'Apply to unlimited projects',
      'Basic profile',
      'Email notifications'
    ]
  },
  {
    id: 'candidate-pro-monthly',
    name: 'Professional',
    price: 249, // â‚¹249 per month
    interval: 'month',
    razorpayPlanId: 'plan_candidate_pro_monthly_india',
    description: 'Premium features to stand out',
    popular: true,
    features: [
      'Advanced resume builder',
      'Portfolio showcase',
      'Priority applications',
      'Keyword optimization',
      'Application analytics',
      'Premium badge visibility',
      'Skills certifications'
    ]
  },
  {
    id: 'candidate-pro-yearly',
    name: 'Professional (Annual)',
    price: 1999, // â‚¹1,999 per year (5 months free)
    interval: 'year',
    razorpayPlanId: 'plan_candidate_pro_yearly_india',
    description: 'Best value with 5 months free',
    discountPercentage: 33, // 5 months free = ~33% discount
    features: [
      'Advanced resume builder',
      'Portfolio showcase',
      'Priority applications',
      'Keyword optimization',
      'Application analytics',
      'Premium badge visibility',
      'Skills certifications',
      '5 months free!'
    ]
  }
];

// Feature access mapping
export const FEATURE_ACCESS = {
  free: {
    projectsLimit: 3,
    candidateSearchesLimit: 10,
    videoInterviewsLimit: 0,
    aiAssistantQueriesLimit: 5,
    storageLimit: 100 * 1024 * 1024, // 100MB
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    skillsAssessments: false
  },
  pro: {
    projectsLimit: -1, // Unlimited
    candidateSearchesLimit: -1, // Unlimited
    videoInterviewsLimit: -1, // Unlimited
    aiAssistantQueriesLimit: -1, // Unlimited
    storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    skillsAssessments: true
  }
};

// Helper functions for Indian market
export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatIndianNumber = (number: number): string => {
  return new Intl.NumberFormat('en-IN').format(number);
};

// Payment utility functions
export const getPaymentStatusText = (status: string): string => {
  switch (status) {
    case 'created': return 'Payment Initiated';
    case 'authorized': return 'Payment Authorized';
    case 'captured': return 'Payment Successful';
    case 'refunded': return 'Payment Refunded';
    case 'failed': return 'Payment Failed';
    default: return 'Unknown Status';
  }
};

export const getSubscriptionStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'Active';
    case 'pending': return 'Pending';
    case 'canceled': return 'Cancelled';
    case 'past_due': return 'Past Due';
    case 'incomplete': return 'Incomplete';
    default: return 'Unknown Status';
  }
};






