import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import crypto from 'node:crypto';

const payments = new Hono();

// CORS middleware
payments.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Razorpay configuration
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

// Development mode check
const isDevelopment = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

if (isDevelopment) {
  console.log('🔧 DEVELOPMENT MODE: Razorpay credentials not configured');
  console.log('💡 To enable payments:');
  console.log('   1. Sign up at https://razorpay.com');
  console.log('   2. Get your API keys from the dashboard');
  console.log('   3. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables');
  console.log('   4. See RAZORPAY_SETUP.md for detailed instructions');
  console.log('📝 Payment features will use mock data for testing');
} else {
  console.log('💳 Razorpay payment gateway configured successfully');
}

// Razorpay API base URL
const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

// Helper function to make Razorpay API calls
async function razorpayRequest(endpoint: string, method: string = 'GET', data?: any) {
  if (isDevelopment) {
    console.log(`🔧 Mock Razorpay API call: ${method} ${endpoint}`);
    throw new Error('Razorpay not configured - using mock data');
  }

  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const headers: Record<string, string> = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  const options: RequestInit = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${RAZORPAY_API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.description || `Razorpay API error: ${response.status}`);
  }

  return response.json();
}

// Helper function to verify Razorpay signature
function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (isDevelopment) {
    console.log('🔧 Mock signature verification - always returns true in development');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET!)
    .update(orderId + '|' + paymentId)
    .digest('hex');
  
  return expectedSignature === signature;
}

// Get subscription plans
payments.get('/plans', async (c) => {
  try {
    // Return static plans with Indian pricing
    const plans = [
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
        price: 1999,
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
        price: 19990,
        interval: 'year',
        razorpayPlanId: 'plan_pro_yearly_india',
        description: 'Best value with 2 months free',
        discountPercentage: 17,
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

    return c.json({ plans, success: true });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return c.json({ error: 'Failed to fetch plans' }, 500);
  }
});

// Create Razorpay order for subscription
payments.post('/create-subscription-order', async (c) => {
  try {
    const { planId } = await c.req.json();
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get plan details
    const plans = [
      { id: 'pro-monthly', price: 1999, name: 'Professional Monthly' },
      { id: 'pro-yearly', price: 19990, name: 'Professional Annual' },
      { id: 'candidate-pro-monthly', price: 249, name: 'Candidate Professional Monthly' },
      { id: 'candidate-pro-yearly', price: 1999, name: 'Candidate Professional Annual' }
    ];

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      return c.json({ error: 'Invalid plan ID' }, 400);
    }

    if (plan.price === 0) {
      return c.json({ error: 'Cannot create order for free plan' }, 400);
    }

    // Create order data
    const orderData = {
      amount: plan.price * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `subscription_${user.id}_${Date.now()}`,
      notes: {
        planId,
        userId: user.id,
        planName: plan.name
      }
    };

    let order;
    try {
      order = await razorpayRequest('/orders', 'POST', orderData);
      console.log('✅ Razorpay order created successfully:', order.id);
    } catch (razorpayError) {
      console.log('🔧 Razorpay not configured, creating mock order for development');
      
      // Create a mock order for development/testing
      order = {
        id: `order_mock_${Date.now()}`,
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: 'created',
        notes: orderData.notes,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      console.log('🔧 Created mock order for development:', order.id);
    }

    // Store order in KV store for verification
    await kv.set(`razorpay_order_${order.id}`, {
      orderId: order.id,
      userId: user.id,
      planId,
      amount: plan.price,
      currency: 'INR',
      status: 'created',
      createdAt: new Date().toISOString(),
      isDevelopmentOrder: isDevelopment
    });

    return c.json({ order, success: true });

  } catch (error) {
    console.error('Error creating subscription order:', error);
    return c.json({ error: 'Failed to create subscription order' }, 500);
  }
});

// Create one-time payment order
payments.post('/create-order', async (c) => {
  try {
    const { amount, currency = 'INR', metadata = {} } = await c.req.json();
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Create order data
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `payment_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        ...metadata
      }
    };

    let order;
    try {
      order = await razorpayRequest('/orders', 'POST', orderData);
    } catch (razorpayError) {
      console.log('🔧 Creating mock order for development');
      
      // Create a mock order for development
      order = {
        id: `order_mock_${Date.now()}`,
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: 'created',
        notes: orderData.notes
      };
    }

    // Store order in KV store
    await kv.set(`razorpay_order_${order.id}`, {
      orderId: order.id,
      userId: user.id,
      amount: amount,
      currency,
      status: 'created',
      metadata,
      createdAt: new Date().toISOString(),
      isDevelopmentOrder: isDevelopment
    });

    return c.json({ order, success: true });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return c.json({ error: 'Failed to create payment order' }, 500);
  }
});

// Verify payment and activate subscription
payments.post('/verify-and-activate-subscription', async (c) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = await c.req.json();
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get stored order
    const orderData = await kv.get(`razorpay_order_${razorpay_order_id}`);
    if (!orderData) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Verify payment signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature && !isDevelopment) {
      return c.json({ error: 'Invalid payment signature' }, 400);
    }

    if (isDevelopment) {
      console.log('🔧 Development mode: Skipping signature verification');
    }

    // Get plan details
    const plans = [
      { id: 'pro-monthly', name: 'Professional', interval: 'month', duration: 30 },
      { id: 'pro-yearly', name: 'Professional Annual', interval: 'year', duration: 365 },
      { id: 'candidate-pro-monthly', name: 'Candidate Professional', interval: 'month', duration: 30 },
      { id: 'candidate-pro-yearly', name: 'Candidate Professional Annual', interval: 'year', duration: 365 }
    ];

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      return c.json({ error: 'Invalid plan ID' }, 400);
    }

    // Create subscription record
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = currentTime + (plan.duration * 24 * 60 * 60); // Convert days to seconds

    const subscription = {
      id: `sub_${Date.now()}`,
      planId,
      status: 'active',
      currentPeriodStart: currentTime,
      currentPeriodEnd: endTime,
      cancelAtPeriodEnd: false,
      razorpaySubscriptionId: `razorpay_sub_${Date.now()}`,
      nextBillingAt: endTime,
      userId: user.id,
      createdAt: new Date().toISOString(),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      isDevelopmentSubscription: isDevelopment
    };

    // Store subscription
    await kv.set(`subscription_${user.id}`, subscription);

    // Update order status
    await kv.set(`razorpay_order_${razorpay_order_id}`, {
      ...orderData,
      status: 'completed',
      paymentId: razorpay_payment_id,
      completedAt: new Date().toISOString()
    });

    // Store payment record
    await kv.set(`payment_${razorpay_payment_id}`, {
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
      userId: user.id,
      amount: orderData.amount,
      currency: orderData.currency,
      status: 'captured',
      planId,
      createdAt: new Date().toISOString(),
      isDevelopmentPayment: isDevelopment
    });

    const successMessage = isDevelopment 
      ? `✅ Development subscription activated for user ${user.id}, plan: ${planId}`
      : `✅ Subscription activated for user ${user.id}, plan: ${planId}`;
    
    console.log(successMessage);

    return c.json({ subscription, success: true });

  } catch (error) {
    console.error('Error verifying payment and activating subscription:', error);
    return c.json({ error: 'Failed to verify payment and activate subscription' }, 500);
  }
});

// Verify one-time payment
payments.post('/verify-payment', async (c) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await c.req.json();
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get stored order
    const orderData = await kv.get(`razorpay_order_${razorpay_order_id}`);
    if (!orderData) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Verify payment signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature && !isDevelopment) {
      return c.json({ error: 'Invalid payment signature' }, 400);
    }

    // Update order status
    await kv.set(`razorpay_order_${razorpay_order_id}`, {
      ...orderData,
      status: 'completed',
      paymentId: razorpay_payment_id,
      completedAt: new Date().toISOString()
    });

    // Store payment record
    const payment = {
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
      userId: user.id,
      amount: orderData.amount,
      currency: orderData.currency,
      status: 'captured',
      createdAt: new Date().toISOString(),
      isDevelopmentPayment: isDevelopment
    };

    await kv.set(`payment_${razorpay_payment_id}`, payment);

    return c.json({ success: true, payment });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return c.json({ error: 'Failed to verify payment' }, 500);
  }
});

// Get current subscription
payments.get('/subscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get subscription from KV store
    const subscription = await kv.get(`subscription_${user.id}`);
    if (!subscription) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    return c.json({ subscription, success: true });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// Cancel subscription
payments.post('/subscription/cancel', async (c) => {
  try {
    const { immediate = false } = await c.req.json();
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get current subscription
    const subscription = await kv.get(`subscription_${user.id}`);
    if (!subscription) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    // Update subscription
    const updatedSubscription = {
      ...subscription,
      status: immediate ? 'canceled' : 'active',
      cancelAtPeriodEnd: !immediate,
      canceledAt: new Date().toISOString()
    };

    if (immediate) {
      updatedSubscription.currentPeriodEnd = Math.floor(Date.now() / 1000);
    }

    await kv.set(`subscription_${user.id}`, updatedSubscription);

    const cancelMessage = isDevelopment
      ? `📋 Development subscription ${immediate ? 'cancelled immediately' : 'scheduled for cancellation'} for user ${user.id}`
      : `📋 Subscription ${immediate ? 'cancelled immediately' : 'scheduled for cancellation'} for user ${user.id}`;

    console.log(cancelMessage);

    return c.json({ subscription: updatedSubscription, success: true });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// Resume subscription
payments.post('/subscription/resume', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get current subscription
    const subscription = await kv.get(`subscription_${user.id}`);
    if (!subscription) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    // Update subscription
    const updatedSubscription = {
      ...subscription,
      status: 'active',
      cancelAtPeriodEnd: false,
      resumedAt: new Date().toISOString()
    };

    await kv.set(`subscription_${user.id}`, updatedSubscription);

    const resumeMessage = isDevelopment
      ? `🔄 Development subscription resumed for user ${user.id}`
      : `🔄 Subscription resumed for user ${user.id}`;

    console.log(resumeMessage);

    return c.json({ subscription: updatedSubscription, success: true });

  } catch (error) {
    console.error('Error resuming subscription:', error);
    return c.json({ error: 'Failed to resume subscription' }, 500);
  }
});

// Get usage metrics
payments.get('/usage', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get or create usage metrics
    let usage = await kv.get(`usage_${user.id}`);
    
    if (!usage) {
      // Create default usage metrics
      usage = {
        projectsPosted: 0,
        projectsLimit: 3, // Free plan default
        candidateSearches: 0,
        candidateSearchesLimit: 10, // Free plan default
        videoInterviews: 0,
        videoInterviewsLimit: 0, // Free plan default
        aiAssistantQueries: 0,
        aiAssistantQueriesLimit: 5, // Free plan default
        storageUsed: 0,
        storageLimit: 100 * 1024 * 1024, // 100MB
        lastUpdated: new Date().toISOString()
      };

      // Check if user has active subscription to update limits
      const subscription = await kv.get(`subscription_${user.id}`);
      if (subscription && subscription.status === 'active') {
        usage.projectsLimit = -1; // Unlimited
        usage.candidateSearchesLimit = -1; // Unlimited
        usage.videoInterviewsLimit = -1; // Unlimited
        usage.aiAssistantQueriesLimit = -1; // Unlimited
        usage.storageLimit = 10 * 1024 * 1024 * 1024; // 10GB
      }

      await kv.set(`usage_${user.id}`, usage);
    }

    return c.json({ usage, success: true });

  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return c.json({ error: 'Failed to fetch usage metrics' }, 500);
  }
});

// Get payment history
payments.get('/history', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ') ) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get all payments for user
    const payments = await kv.getByPrefix(`payment_`);
    const userPayments = payments
      .filter(payment => payment.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ payments: userPayments, success: true });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return c.json({ error: 'Failed to fetch payment history' }, 500);
  }
});

// Get billing info and invoice generation
payments.get('/billing', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get current subscription
    const subscription = await kv.get(`subscription_${user.id}`);
    
    // Get payment history
    const allPayments = await kv.getByPrefix('payment_');
    const userPayments = allPayments
      .filter(payment => payment.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get usage metrics
    const usage = await kv.get(`usage_${user.id}`) || {
      projectsPosted: 0,
      candidateSearches: 0,
      videoInterviews: 0,
      aiAssistantQueries: 0,
      storageUsed: 0
    };

    const billingInfo = {
      subscription: subscription || null,
      nextBillingDate: subscription?.nextBillingAt ? new Date(subscription.nextBillingAt * 1000).toISOString() : null,
      billingAmount: subscription?.status === 'active' ? 
        (subscription.planId.includes('yearly') ? 19990 : 
         subscription.planId.includes('candidate') ? 249 : 1999) : 0,
      currency: 'INR',
      paymentHistory: userPayments.slice(0, 10), // Last 10 payments
      currentUsage: usage,
      billingAddress: null, // To be implemented if needed
      taxInfo: {
        taxRate: 18, // GST in India
        taxNumber: null // User's GSTIN if provided
      }
    };

    return c.json({ billing: billingInfo, success: true });

  } catch (error) {
    console.error('Error fetching billing info:', error);
    return c.json({ error: 'Failed to fetch billing information' }, 500);
  }
});

// Health check
payments.get('/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'payments',
    timestamp: new Date().toISOString(),
    razorpayConfigured: !isDevelopment,
    developmentMode: isDevelopment,
    message: isDevelopment 
      ? 'Running in development mode - see RAZORPAY_SETUP.md for configuration instructions'
      : 'Razorpay payment gateway fully configured'
  });
});

export default payments;




