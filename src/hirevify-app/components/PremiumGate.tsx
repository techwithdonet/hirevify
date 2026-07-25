import { ReactNode, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { usePremiumAccess, PremiumFeatureKey, PREMIUM_FEATURES } from '../utils/premium';
import { useAuth } from './AuthProvider';

interface PremiumGateProps {
 featureKey: PremiumFeatureKey;
 children: ReactNode;
 onUpgrade: () => void;
 fallbackTitle?: string;
 fallbackDescription?: string;
 showFullPage?: boolean;
 className?: string;
}

/**
 * PremiumGate component that wraps premium features
 * Shows upgrade prompt for non-premium users
 */
export function PremiumGate({
 featureKey,
 children,
 onUpgrade,
 fallbackTitle,
 fallbackDescription,
 showFullPage = false,
 className = ""
}: PremiumGateProps) {
 // Call hooks at top level
 const { authInitialized } = useAuth();
 const { checkAccess, getFeatureInfo, getSubscription, isLoading } = usePremiumAccess();

 // Stay visually inert until authentication and access are verified. This
 // avoids both the unrelated full-page loader and mounting paid feature
 // effects before the existing entitlement check has completed.
 if (!authInitialized || isLoading) {
 return null;
 }
 
 // Simple access check
 const hasAccess = checkAccess(featureKey);
 const feature = getFeatureInfo(featureKey);
 const subscription = getSubscription();

 // If user has access, render the children
 if (hasAccess) {
 return <>{children}</>;
 }

 // Show upgrade prompt
 const title = fallbackTitle || feature.name;
 const description = fallbackDescription || feature.description;

 if (showFullPage) {
 return (
 <div className={`min-h-screen bg-background flex items-center justify-center p-6 ${className}`}>
 <div className="max-w-2xl w-full">
 <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
 <CardHeader className="text-center pb-6">
 <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-100 rounded-full flex items-center justify-center">
 <Crown className="w-10 h-10 text-primary" />
 </div>
 <CardTitle className="text-3xl font-bold text-foreground mb-2">
 {title}
 </CardTitle>
 <p className="text-lg text-muted-foreground max-w-lg mx-auto">
 {description}
 </p>
 </CardHeader>
 <CardContent className="text-center space-y-6">
 <div className="bg-white rounded-lg p-6 border border-border">
 <h4 className="font-semibold text-foreground mb-3">This premium feature includes:</h4>
 <ul className="text-sm text-muted-foreground space-y-2 mb-6">
 <li className="flex items-center">
 <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
 Advanced AI-powered functionality
 </li>
 <li className="flex items-center">
 <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
 Priority customer support
 </li>
 <li className="flex items-center">
 <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
 Enhanced analytics and insights
 </li>
 <li className="flex items-center">
 <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
 Regular feature updates
 </li>
 </ul>

 <div className="space-y-3">
 <Button 
 onClick={onUpgrade}
 size="lg"
 className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3"
 >
 <Crown className="w-5 h-5 mr-2" />
 View Pro Access
 <ArrowRight className="w-5 h-5 ml-2" />
 </Button>
 
 <p className="text-xs text-muted-foreground">
 Pro access is currently enabled manually while online payments are being prepared.
 </p>
 </div>
 </div>

 {subscription.tier === 'free' && (
 <div className="text-left bg-muted/30 rounded-lg p-4">
 <div className="flex items-start space-x-3">
 <Lock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
 <div>
 <p className="text-sm font-medium text-foreground mb-1">
 Unlock Premium Features
 </p>
 <p className="text-xs text-muted-foreground">
 Get access to advanced AI tools, priority support, and exclusive features 
 designed to accelerate your hiring process.
 </p>
 </div>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 );
 }

 // Compact version for inline use
 return (
 <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50/30 ${className}`}>
 <CardContent className="p-6 text-center">
 <div className="mb-4">
 <div className="mx-auto mb-3 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
 <Crown className="w-6 h-6 text-primary" />
 </div>
 <h3 className="font-semibold text-foreground mb-2">{title}</h3>
 <p className="text-sm text-muted-foreground mb-4">{description}</p>
 </div>
 
 <Button 
 onClick={onUpgrade}
 className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-medium"
 >
 <Crown className="w-4 h-4 mr-2" />
 View Pro Access
 </Button>
 
 </CardContent>
 </Card>
 );
}

/**
 * Utility component for premium feature badges
 */
export function PremiumBadge({ 
 featureKey, 
 className = "" 
}: { 
 featureKey: PremiumFeatureKey;
 className?: string;
}) {
 const { authInitialized } = useAuth();
 const { checkAccess, isLoading } = usePremiumAccess();

 if (!authInitialized || isLoading) return null;

 const hasAccess = checkAccess(featureKey);

 if (hasAccess) return null;

 return (
 <Badge className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs ${className}`}>
 <Crown className="w-3 h-3 mr-1" />
 Pro
 </Badge>
 );
}

/**
 * Hook for premium feature navigation with automatic access checking
 */
export function usePremiumNavigation(onUpgrade: () => void) {
 const { checkAccess } = usePremiumAccess();

 const navigateToFeature = useCallback((
 featureKey: PremiumFeatureKey,
 navigationCallback: () => void,
 _fallbackMessage?: string
 ) => {
 try {
 if (checkAccess(featureKey)) {
 navigationCallback();
 } else {
 const feature = PREMIUM_FEATURES[featureKey];
 console.log(`Premium access required for: ${feature.name}`);
 onUpgrade();
 }
 } catch (error) {
 console.error('Error in premium navigation:', error);
 onUpgrade(); // Fallback to upgrade page
 }
 }, [checkAccess, onUpgrade]);

 return { 
 navigateToFeature, 
 checkAccess: useCallback((featureKey: PremiumFeatureKey) => {
 try {
 return checkAccess(featureKey);
 } catch (error) {
 console.error('Error checking premium access:', error);
 return false;
 }
 }, [checkAccess])
 };
}








