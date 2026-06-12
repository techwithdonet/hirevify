import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Crown, TestTube, RefreshCw, Info } from 'lucide-react';
import { 
  setTestSubscription, 
  clearTestSubscription, 
  usePremiumAccess,
  PREMIUM_FEATURES 
} from '../utils/premium';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

/**
 * Testing panel for premium features - only shows in development
 */
export function PremiumTestingPanel() {
  const { user } = useAuth();
  const { getSubscription, isTestAccount } = usePremiumAccess();
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [isVisible, setIsVisible] = useState(false);
  
  const subscription = getSubscription();

  // Only show in development or for test accounts
  let isDevelopment = false;
  try {
    isDevelopment = process.env.NODE_ENV === 'development' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname.includes('localhost') ||
                   isTestAccount;
  } catch (error) {
    console.warn('Error checking development environment:', error);
    isDevelopment = false;
  }

  // Only render if in development and user exists
  if (!isDevelopment || !user) {
    return null;
  }

  // Minimize re-renders with toggle visibility
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg text-xs"
          title="Show Premium Testing Panel"
        >
          <TestTube className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleSetSubscription = () => {
    try {
      setTestSubscription(selectedTier);
      toast.success(`Test subscription set to ${selectedTier}`);
      // Force a refresh to update UI
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error setting test subscription:', error);
      toast.error('Failed to set test subscription');
    }
  };

  const handleClearSubscription = () => {
    try {
      clearTestSubscription();
      toast.success('Test subscription cleared');
      // Force a refresh to update UI
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error clearing test subscription:', error);
      toast.error('Failed to clear test subscription');
    }
  };

  const userFeatures = Object.entries(PREMIUM_FEATURES).filter(
    ([key, feature]) => !user?.userType || feature.userType === user.userType
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-blue-50 border-blue-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm text-blue-800">
            <TestTube className="w-4 h-4 mr-2" />
            Premium Testing Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Current Status:</span>
              <Badge 
                className={`text-xs ${
                  subscription.isActive 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {subscription.tier.toUpperCase()}
                {subscription.isActive && <Crown className="w-3 h-3 ml-1" />}
              </Badge>
            </div>
            
            {user && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700">Account Type:</span>
                <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                  {isTestAccount ? 'Test Account' : 'Regular'}
                </Badge>
              </div>
            )}
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-blue-700">Test Tier:</label>
            <Select value={selectedTier} onValueChange={(value: any) => setSelectedTier(value)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Tier</SelectItem>
                <SelectItem value="pro">Pro Tier</SelectItem>
                <SelectItem value="enterprise">Enterprise Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={handleSetSubscription}
              className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Crown className="w-3 h-3 mr-1" />
              Set Tier
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClearSubscription}
              className="flex-1 text-xs border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Available Features for User Type */}
          {user && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Info className="w-3 h-3 mr-1 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {user.userType === 'recruiter' ? 'Recruiter' : 'Candidate'} Premium Features:
                </span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {userFeatures.map(([key, feature]) => (
                  <div key={key} className="text-xs text-blue-600 bg-white rounded px-2 py-1 border border-blue-100">
                    {feature.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-blue-600 bg-blue-100 rounded p-2 border border-blue-200">
            <strong>Note:</strong> This panel only appears in development mode or for test accounts. 
            Changes require a page refresh to take effect.
          </div>

          <div className="flex justify-end">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsVisible(false)}
              className="text-xs"
            >
              Hide Panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







