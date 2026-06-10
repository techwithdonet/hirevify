import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, Users, Briefcase } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp, isLoading, connectionStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'recruiter' | 'candidate'>('candidate');
  
  // Test account helpers
  const useTestAccount = (type: 'recruiter' | 'candidate') => {
    setEmail(type === 'recruiter' ? 'recruiter@hirevify.com' : 'candidate@hirevify.com');
    setPassword('TestPassword123!');
    setUserType(type);
    setActiveTab('signin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (activeTab === 'signin') {
        console.log('🔐 Attempting signin for:', email);
        const result = await signIn(email, password);
        
        if (result.success) {
          console.log('✅ Signin successful');
          toast.success(result.message || 'Welcome back!');
          onClose();
          resetForm();
        } else {
          console.error('❌ Signin failed:', result.message);
          toast.error(result.message || 'Sign in failed');
        }
      } else {
        console.log('📝 Attempting signup for:', email, userType);
        const result = await signUp(email, password, name, userType);
        
        if (result.success) {
          console.log('✅ Signup successful');
          toast.success(result.message || 'Account created successfully!');
          onClose();
          resetForm();
        } else {
          console.error('❌ Signup failed:', result.message);
          toast.error(result.message || 'Sign up failed');
        }
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setUserType('candidate');
    setShowPassword(false);
  };

  const handleClose = () => {
    if (!formLoading && !isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Welcome to HireVify
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
              {connectionStatus === 'connected' ? 'Online' : connectionStatus === 'checking' ? 'Connecting' : 'Offline'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Sign in to your existing account or create a new account to get started with HireVify's skills-first hiring platform.
          </DialogDescription>
        </DialogHeader>

        {/* Test Accounts Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Quick Demo Access
            </CardTitle>
            <CardDescription className="text-xs">
              Skip the setup and try HireVify immediately with our test accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => useTestAccount('recruiter')}
                className="h-auto py-2 px-3 text-xs"
                disabled={formLoading || isLoading}
              >
                <Briefcase className="h-3 w-3 mr-1" />
                <div className="text-left">
                  <div className="font-medium">Recruiter</div>
                  <div className="text-muted-foreground">Post jobs</div>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => useTestAccount('candidate')}
                className="h-auto py-2 px-3 text-xs"
                disabled={formLoading || isLoading}
              >
                <Users className="h-3 w-3 mr-1" />
                <div className="text-left">
                  <div className="font-medium">Candidate</div>
                  <div className="text-muted-foreground">Find jobs</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={formLoading || isLoading}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={formLoading || isLoading}
                    className="bg-background pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={formLoading || isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={formLoading || isLoading || connectionStatus !== 'connected' || !email || !password}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={formLoading || isLoading}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={formLoading || isLoading}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={formLoading || isLoading}
                    className="bg-background pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={formLoading || isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup 
                  value={userType} 
                  onValueChange={(value: 'recruiter' | 'candidate') => setUserType(value)}
                  disabled={formLoading || isLoading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="candidate" id="candidate" />
                    <Label htmlFor="candidate" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Candidate</div>
                        <div className="text-sm text-muted-foreground">Looking for opportunities</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recruiter" id="recruiter" />
                    <Label htmlFor="recruiter" className="flex items-center gap-2 cursor-pointer">
                      <Briefcase className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Recruiter</div>
                        <div className="text-sm text-muted-foreground">Hiring talent</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={formLoading || isLoading || connectionStatus !== 'connected' || !name || !email || !password || password.length < 8}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </TabsContent>
          </form>
        </Tabs>

        {connectionStatus !== 'connected' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  {connectionStatus === 'checking' 
                    ? 'Connecting to server...' 
                    : 'Connection issue. Please wait while we reconnect.'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}





