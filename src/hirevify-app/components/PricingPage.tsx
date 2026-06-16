import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { 
  ArrowLeft, 
  Briefcase, 
  Check, 
  Crown, 
  Users, 
  Target,
  BarChart3,
  Brain,
  Star,
  Zap,
  Shield,
  CreditCard,
  Smartphone,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Info
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { 
  PaymentsAPI, 
  SubscriptionPlan, 
  SUBSCRIPTION_PLANS, 
  CANDIDATE_SUBSCRIPTION_PLANS,
  formatIndianCurrency,
  RazorpayPaymentResponse 
} from '../utils/api/payments';
import { toast } from 'sonner';
import { HireVifyLogo } from './HireVifyLogo';

interface PricingPageProps {
  onBack: () => void;
  onManageSubscription: () => void;
  userType?: 'recruiter' | 'candidate' | null;
}

export function PricingPage({ onBack, onManageSubscription, userType }: PricingPageProps) {
  const { user, accessToken } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [developmentMode, setDevelopmentMode] = useState(false);

  useEffect(() => {
    loadPlansAndSubscription();
    checkDevelopmentMode();
  }, [userType, accessToken]);

  const checkDevelopmentMode = async () => {
    try {
      const response = await fetch('/api/payments/health');
      if (response.ok) {
        const healthData = await response.json();
        setDevelopmentMode(healthData.developmentMode || false);
      }
    } catch (error) {
      console.log('Could not check payment health status');
    }
  };

  const loadPlansAndSubscription = async () => {
    try {
      setLoading(true);
      
      // Load appropriate plans based on user type
      const availablePlans = userType === 'candidate' 
        ? CANDIDATE_SUBSCRIPTION_PLANS 
        : SUBSCRIPTION_PLANS;
      
      setPlans(availablePlans);

      // Load current subscription if user is authenticated
      if (accessToken) {
        try {
          const subscription = await PaymentsAPI.getCurrentSubscription(accessToken);
          setCurrentSubscription(subscription);
        } catch (error) {
          // No subscription found is ok
          console.log('No current subscription found');
        }
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user || !accessToken) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (plan.price === 0) {
      toast.info('You are already on the free plan');
      return;
    }

    if (currentSubscription?.planId === plan.id) {
      toast.info('You are already subscribed to this plan');
      return;
    }

    try {
      setProcessingPayment(true);
      setSelectedPlan(plan.id);

      // Create Razorpay order
      const order = await PaymentsAPI.createSubscriptionOrder(plan.id, accessToken);

      // Show development mode info if applicable
      if (developmentMode) {
        toast.success('Development Mode: Subscription activated!', {
          description: 'This is a test subscription. Real payments require Razorpay setup.'
        });
        
        // In development mode, simulate immediate success
        setTimeout(async () => {
          try {
            const mockPaymentResponse = {
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_order_id: order.id,
              razorpay_signature: `mock_signature_${Date.now()}`
            };

            const subscription = await PaymentsAPI.verifyPaymentAndActivateSubscription(
              mockPaymentResponse,
              plan.id,
              accessToken
            );

            setCurrentSubscription(subscription);
            toast.success('Development subscription activated!');
            setTimeout(() => onManageSubscription(), 1500);
          } catch (error) {
            toast.error('Failed to activate development subscription');
          }
        }, 1000);
        return;
      }

      // Production Razorpay checkout
      await PaymentsAPI.initiateCheckout(
        order,
        {
          name: user.name,
          email: user.email,
          contact: (user as any).phone || ""
        },
        async (response: RazorpayPaymentResponse) => {
          try {
            const subscription = await PaymentsAPI.verifyPaymentAndActivateSubscription(
              response,
              plan.id,
              accessToken
            );

            setCurrentSubscription(subscription);
            toast.success('Subscription activated successfully!', {
              description: `Welcome to ${plan.name}! Your subscription is now active.`
            });

            setTimeout(() => onManageSubscription(), 2000);

          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment completed but verification failed. Please contact support.');
          }
        },
        (error: any) => {
          console.error('Payment failed:', error);
          toast.error('Payment failed. Please try again.');
        }
      );

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription process');
    } finally {
      setProcessingPayment(false);
      setSelectedPlan(null);
    }
  };

  // Function to get the current price based on billing period
  const getCurrentPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) {
      return 'Free';
    }
    
    // For yearly plans, show monthly equivalent
    if (plan.interval === 'year') {
      const monthlyPrice = Math.round(plan.price / 12);
      return formatIndianCurrency(monthlyPrice);
    }
    
    return formatIndianCurrency(plan.price);
  };

  // Function to get the billing period text
  const getBillingText = (plan: SubscriptionPlan) => {
    if (plan.price === 0) {
      return '';
    }
    
    if (plan.interval === 'year') {
      return '/month (billed annually)';
    }
    
    return '/month';
  };

  // Get discount savings text
  const getSavingsText = (plan: SubscriptionPlan) => {
    if (plan.discountPercentage) {
      return `Save ${plan.discountPercentage}%`;
    }
    return null;
  };

  // Filter plans based on billing period preference
  const filteredPlans = plans.filter(plan => {
    if (plan.price === 0) return true; // Always show free plan
    return isAnnual ? plan.interval === 'year' : plan.interval === 'month';
  });

  const isPlanCurrent = (plan: SubscriptionPlan) => {
    if (!currentSubscription) {
      return plan.price === 0; // Free plan is current if no subscription
    }
    return currentSubscription.planId === plan.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Skeleton className="h-16 w-16 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto mb-8" />
            <Skeleton className="h-12 w-64 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border">
                <CardHeader className="text-center pb-6">
                  <Skeleton className="h-8 w-32 mx-auto mb-4" />
                  <Skeleton className="h-12 w-24 mx-auto mb-4" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="hv-page-shell">
      {/* Header */}
      <header className="hv-dashboard-header">
        <div className="hv-container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex min-w-0 items-center gap-3">
              <HireVifyLogo size="lg" className="h-16" />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-normal text-slate-950">HireVify Pricing</h1>
                <p className="text-sm text-slate-600">
                  Choose the right plan for {userType === 'recruiter' ? 'your company' : 'your career'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="hv-container py-10 sm:py-12">
        {/* Development Mode Banner */}
        {developmentMode && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Development Mode:</strong> Payment features are running with test data. 
                  Subscriptions will work but no real money will be charged.
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/RAZORPAY_SETUP.md', '_blank')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Setup Guide
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="mb-4 text-4xl font-semibold tracking-normal text-slate-950">
            {userType === 'recruiter' ? 'Hiring Plans' : 'Career Plans'}
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            {userType === 'recruiter' 
              ? 'Scale your hiring process with advanced tools and analytics'
              : 'Advance your career with premium job search tools'
            }
          </p>
          
          {/* Pricing Toggle */}
          <div className="mb-8 inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <Button
              variant={isAnnual ? "ghost" : "default"}
              size="sm"
              onClick={() => setIsAnnual(false)}
              className={`px-6 ${!isAnnual ? 'bg-background shadow-sm' : 'hover:bg-transparent'}`}
            >
              Monthly
            </Button>
            <Button
              variant={isAnnual ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsAnnual(true)}
              className={`px-6 ${isAnnual ? 'bg-background shadow-sm' : 'hover:bg-transparent'}`}
            >
              Annual
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs">
                Save up to 33%
              </Badge>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 sm:gap-8">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>All Cards Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              <span>UPI & Netbanking</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Digital Wallets</span>
            </div>
          </div>
        </div>

        {/* Current Subscription Alert */}
        {currentSubscription && (
          <Alert className="mb-8 border-primary bg-primary/5">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              You're currently subscribed to the{' '}
              <strong>{plans.find(p => p.id === currentSubscription.planId)?.name || 'Professional'}</strong> plan.
              {currentSubscription.cancelAtPeriodEnd && (
                <span className="text-warning ml-2">
                  (Cancelling at period end)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {filteredPlans.map((plan) => {
            const isCurrent = isPlanCurrent(plan);
            const isProcessing = processingPayment && selectedPlan === plan.id;
            const savings = getSavingsText(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`border relative ${
                  plan.popular 
                    ? 'border-primary shadow-lg' 
                    : 'border-border'
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {savings && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-success text-success-foreground px-3 py-1">
                      {savings}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-foreground text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl text-foreground">{getCurrentPrice(plan)}</span>
                    <span className="text-muted-foreground">{getBillingText(plan)}</span>
                    {plan.interval === 'year' && plan.price > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Total: {formatIndianCurrency(plan.price)} per year
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      isCurrent 
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : plan.popular
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'border-border text-foreground hover:bg-muted'
                    }`}
                    variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                    disabled={isCurrent || isProcessing}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {developmentMode ? 'Activating...' : 'Processing...'}
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : plan.price === 0 ? (
                      'Get Started Free'
                    ) : (
                      <>
                        {developmentMode ? 'Try Now (Test)' : 'Subscribe Now'}
                      </>
                    )}
                  </Button>

                  {isCurrent && currentSubscription && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onManageSubscription}
                      className="w-full"
                    >
                      Manage Subscription
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="text-center mb-16">
          <h3 className="text-xl text-foreground mb-6">
            {developmentMode ? 'Test Payment Options' : 'Secure Payment Options'}
          </h3>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="text-center">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Credit/Debit Cards</p>
            </div>
            <div className="text-center">
              <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">UPI</p>
            </div>
            <div className="text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Net Banking</p>
            </div>
            <div className="text-center">
              <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Digital Wallets</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {developmentMode 
              ? 'Development mode - no real payments will be charged'
              : 'Payments processed securely by Razorpay'
            }
          </p>
        </div>

        {/* Features Comparison */}
        <div className="rounded-lg border border-slate-200 bg-white/80 p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold tracking-normal text-slate-950 text-center mb-8">
            Why Choose {userType === 'recruiter' ? 'HireVify for Recruiting' : 'HireVify Professional'}?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userType === 'recruiter' ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">AI-Powered Matching</h3>
                  <p className="text-muted-foreground text-sm">
                    Advanced algorithms match candidates to projects based on skills and experience
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground text-sm">
                    Track hiring metrics, time-to-hire, and success rates with detailed insights
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Team Collaboration</h3>
                  <p className="text-muted-foreground text-sm">
                    Enable multiple team members to collaborate on hiring decisions
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Automated Screening</h3>
                  <p className="text-muted-foreground text-sm">
                    Save time with automated candidate screening and qualification
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Priority Applications</h3>
                  <p className="text-muted-foreground text-sm">
                    Get noticed first with premium badge visibility to recruiters
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Smart Optimization</h3>
                  <p className="text-muted-foreground text-sm">
                    AI-powered keyword suggestions to improve your ATS match scores
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Portfolio Showcase</h3>
                  <p className="text-muted-foreground text-sm">
                    Display your work with integrated portfolio features
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">Application Analytics</h3>
                  <p className="text-muted-foreground text-sm">
                    Track your application performance and optimization opportunities
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FAQ or Contact */}
        <div className="text-center mt-16">
          <h3 className="text-xl text-foreground mb-4">Need help choosing?</h3>
          <p className="text-muted-foreground mb-6">
            Contact our team to find the perfect plan for your needs
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="border-border text-foreground hover:bg-muted">
              Contact Sales
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-muted">
              View FAQ
            </Button>
            {developmentMode && (
              <Button 
                variant="outline" 
                onClick={() => window.open('/RAZORPAY_SETUP.md', '_blank')}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Setup Payments
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}








