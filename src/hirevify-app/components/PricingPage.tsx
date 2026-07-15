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
 CheckCircle,
 Info
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
 SubscriptionPlan,
 SUBSCRIPTION_PLANS,
 CANDIDATE_SUBSCRIPTION_PLANS,
 formatIndianCurrency
} from '../utils/api/payments';
import { subscriptionsService } from '../services/subscriptionsService';
import { toast } from 'sonner';
import { HireVifyLogo } from './HireVifyLogo';

interface PricingPageProps {
 onBack: () => void;
 onManageSubscription: () => void;
 userType?: 'recruiter' | 'candidate' | null;
}

export function PricingPage({ onBack, onManageSubscription, userType }: PricingPageProps) {
 const { user } = useAuth();
 const [isAnnual, setIsAnnual] = useState(false);
 const [plans, setPlans] = useState<SubscriptionPlan[]>(() =>
 userType === 'candidate'? CANDIDATE_SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS
 );
 const [loading, setLoading] = useState(false);
 const [currentSubscription, setCurrentSubscription] = useState<any>(null);

 useEffect(() => {
 loadPlansAndSubscription();
 }, [userType, user?.id]);

 const loadPlansAndSubscription = async () => {
 try {
 setLoading(true);
 
 // Load appropriate plans based on user type
 const availablePlans = userType === 'candidate'? CANDIDATE_SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS;
 
 setPlans(availablePlans);

 if (user?.id) {
 const subscription = await subscriptionsService.getUserSubscription(user.id);
 setCurrentSubscription(subscription.data);
 } else {
 setCurrentSubscription(null);
 }
 } catch (error) {
 console.error('Error loading pricing data:', error);
 toast.error('Failed to load pricing information');
 } finally {
 setLoading(false);
 }
 };

 const handleSubscribe = async (plan: SubscriptionPlan) => {
  if (plan.price === 0) {
  onBack();
  return;
  }
  alert('Online payments are not open yet. Ask the HireVify admin to activate Pro for your account.');
};

  // Function to get the current price based on billing period
  const getCurrentPrice = (plan: SubscriptionPlan) => {
  if (plan.price === 0) {
  return 'Free';
  }
  
  // For yearly plans, show annual price
  if (plan.interval === 'year') {
  return formatIndianCurrency(plan.price);
  }
  
  return formatIndianCurrency(plan.price);
  };

  // Function to get the billing period text
  const getBillingText = (plan: SubscriptionPlan) => {
  if (plan.price === 0) {
  return '';
  }
  
  if (plan.interval === 'year') {
  return '/year';
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
 return isAnnual? plan.interval === 'year': plan.interval === 'month';
 });

 const isPlanCurrent = (plan: SubscriptionPlan) => {
 const currentTier = currentSubscription?.isActive? 'pro': 'free';
 return plan.price === 0? currentTier === 'free': currentTier === 'pro';
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
    <div className="premium-page">
      {/* Header */}
      <header className="premium-header">
        <div className="premium-header-inner">
          <Button variant="ghost" onClick={onBack} className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <HireVifyLogo size="lg" className="h-16" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-950">HireVify Pricing</h1>
              <p className="text-sm text-slate-500">
                Choose the right plan for {userType === 'recruiter' ? 'your company' : 'your career'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="premium-content">
 <Alert className="mb-8 border-amber-200 bg-amber-50">
 <Info className="h-4 w-4 text-amber-700" />
 <AlertDescription className="text-amber-900">
 <strong>Online payments are coming soon.</strong> Until Razorpay is ready, HireVify admins can activate or revoke Pro access manually for registered accounts.
 </AlertDescription>
 </Alert>

 {/* Hero Section */}
 <div className="text-center mb-12 sm:mb-16">
 <h1 className="mb-4 text-4xl font-semibold tracking-normal text-slate-950">
 {userType === 'recruiter'? 'Hiring Plans': 'Career Plans'}
 </h1>
 <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
 {userType === 'recruiter'? 'Scale your hiring process with advanced tools and analytics': 'Advance your career with premium job search tools'
 }
 </p>
        {/* Pricing Toggle */}
        <div
          className="hv-pricing-toggle mb-8"
          role="group"
          aria-label="Billing period"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-active={!isAnnual ? "true" : "false"}
            aria-pressed={!isAnnual}
            onClick={() => setIsAnnual(false)}
            className="hv-pricing-toggle-option"
          >
            Monthly
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-active={isAnnual ? "true" : "false"}
            aria-pressed={isAnnual}
            onClick={() => setIsAnnual(true)}
            className="hv-pricing-toggle-option"
          >
            Annual

            <Badge
              variant="secondary"
              data-active={isAnnual ? "true" : "false"}
              className="hv-pricing-toggle-badge"
            >
              Save up to 26%
            </Badge>
          </Button>
        </div>

        {/* Availability indicators */}
 <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 sm:gap-8">
 <div className="flex items-center gap-2">
 <Shield className="w-4 h-4 text-primary" />
 <span>Admin-approved access</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-primary" />
 <span>Free plan available</span>
 </div>
 <div className="flex items-center gap-2">
 <Info className="w-4 h-4 text-primary" />
 <span>Razorpay pending</span>
 </div>
 </div>
 </div>

 {/* Current Subscription Alert */}
 {currentSubscription && (
 <Alert className="mb-8 border-primary bg-primary/5">
 <CheckCircle className="h-4 w-4 text-primary" />
 <AlertDescription className="text-primary">
 Your current plan is <strong>{currentSubscription.isActive? 'Pro': 'Free'}</strong>.
 </AlertDescription>
 </Alert>
 )}

 {/* Pricing Cards */}
 <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
 {filteredPlans.map((plan) => {
 const isCurrent = isPlanCurrent(plan);
 const savings = getSavingsText(plan);
 
 return (
 <Card 
 key={plan.id} 
 className={`border relative ${
 plan.popular? 'border-primary shadow-lg': 'border-border'
 } ${isCurrent? 'ring-2 ring-primary': ''}`}
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
  {plan.discountPercentage && (
  <div className="text-sm font-medium text-green-600 mt-1">
  {plan.discountPercentage}% off
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
 isCurrent? 'bg-muted text-muted-foreground cursor-default': plan.popular? 'bg-primary hover:bg-primary/90 text-primary-foreground': 'border-border text-foreground hover:bg-muted'
 }`}
 variant={isCurrent? 'secondary': plan.popular? 'default': 'outline'}
 disabled={isCurrent}
 onClick={() => handleSubscribe(plan)}
 >
 {isCurrent? (
 'Current Plan'
 ): plan.price === 0? (
 'Get Started Free'
 ): (
 'Request Pro Access'
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

 <div className="mb-16 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
 <h3 className="text-xl font-semibold text-amber-950">Temporary Pro activation</h3>
 <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-amber-900">
 Registered users can receive Pro access from the HireVify admin while online checkout is pending. No payment details are collected on this page.
 </p>
 </div>

 {/* Features Comparison */}
 <div className="rounded-lg border border-slate-200 bg-white/80 p-6 shadow-sm sm:p-8">
 <h2 className="text-2xl font-semibold tracking-normal text-slate-950 text-center mb-8">
 Why Choose {userType === 'recruiter'? 'HireVify for Recruiting': 'HireVify Professional'}?
 </h2>
 
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {userType === 'recruiter'? (
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
 ): (
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
 </div>
 </div>
 </main>
 </div>
 );
}










