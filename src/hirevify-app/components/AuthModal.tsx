import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Loader2, Eye, EyeOff, AlertCircle, Users, Briefcase } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface AuthModalProps {
 isOpen: boolean;
 onClose: () => void;
 defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
 const { signIn, signUp, isLoading, connectionStatus } = useAuth();

 const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
 const [showPassword, setShowPassword] = useState(false);
 const [formLoading, setFormLoading] = useState(false);

 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [name, setName] = useState('');
 const [userType, setUserType] = useState<'recruiter' | 'candidate'>('candidate');

 const resetForm = () => {
 setEmail('');
 setPassword('');
 setName('');
 setUserType('candidate');
 setShowPassword(false);
 };

 const handleClose = () => {
 if (!formLoading &&!isLoading) {
 resetForm();
 onClose();
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setFormLoading(true);

 try {
 if (activeTab === 'signin') {
 console.log('Attempting signin for:', email);

 const result = await signIn(email, password);

 if (result.success) {
 console.log('Signin successful');
 toast.success(result.message || 'Welcome back!');
 onClose();
 resetForm();
 } else {
 console.error('Signin failed:', result.message);
 toast.error(result.message || 'Sign in failed');
 }
 } else {
 console.log('Attempting signup for:', email, userType);

 const result = await signUp(email, password, name, userType);

 if (result.success) {
 console.log('Signup successful');
 toast.success(result.message || 'Account created successfully!');
 onClose();
 resetForm();
 } else {
 console.error('Signup failed:', result.message);
 toast.error(result.message || 'Sign up failed');
 }
 }
 } catch (error) {
 console.error('Auth error:', error);
 toast.error('Something went wrong. Please try again.');
 } finally {
 setFormLoading(false);
 }
 };

 return (
 <Dialog open={isOpen} onOpenChange={handleClose}>
 <DialogContent className="overflow-hidden border border-emerald-950/10 bg-white p-0 text-slate-950 shadow-2xl sm:max-w-md [&>button]:right-4 [&>button]:top-4 [&>button]:text-emerald-950/60 [&>button:hover]:bg-emerald-50 [&>button:hover]:text-emerald-950">
 <DialogHeader className="border-b border-emerald-100 bg-[#f4fbf7] px-6 py-5">
 <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-emerald-950">
 Welcome to HireVify
 <Badge
  variant={connectionStatus === 'connected'? 'default': 'destructive'}
 className={`rounded-full px-2.5 py-1 text-xs font-medium ${
 connectionStatus === 'connected'
 ? 'bg-teal-500 text-white hover:bg-teal-500'
 : connectionStatus === 'checking'
 ? 'bg-amber-100 text-amber-900 hover:bg-amber-100'
 : 'bg-red-100 text-red-900 hover:bg-red-100'
 }`}
 >
 {connectionStatus === 'connected'? 'Online': connectionStatus === 'checking'? 'Connecting': 'Offline'}
 </Badge>
 </DialogTitle>

 <DialogDescription className="max-w-sm text-sm leading-6 text-slate-600">
 Sign in to your existing account or create a new account to get started with HireVify&apos;s skills-first hiring platform.
 </DialogDescription>
 </DialogHeader>

 <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')} className="px-6 py-5">
 <TabsList className="auth-tabs grid h-11 w-full grid-cols-2 rounded-md bg-emerald-50 p-1">
 <TabsTrigger
 value="signin"
 className="auth-tab-trigger rounded-sm text-sm font-semibold shadow-none"
 style={{
 backgroundColor: activeTab === 'signin' ? '#9cf02f' : '#ecfdf5',
 color: '#064e3b',
 opacity: 1,
 }}
 >
 Sign In
 </TabsTrigger>
 <TabsTrigger
 value="signup"
 className="auth-tab-trigger rounded-sm text-sm font-semibold shadow-none"
 style={{
 backgroundColor: activeTab === 'signup' ? '#9cf02f' : '#ecfdf5',
 color: '#064e3b',
 opacity: 1,
 }}
 >
 Sign Up
 </TabsTrigger>
 </TabsList>

 <form onSubmit={handleSubmit} className="space-y-4 pt-2">
 <TabsContent value="signin" className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="signin-email" className="text-sm font-medium text-slate-800">Email</Label>
 <Input
 id="signin-email"
 type="email"
 placeholder="Enter your email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={formLoading || isLoading}
 className="h-10 rounded-sm border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="signin-password" className="text-sm font-medium text-slate-800">Password</Label>
 <div className="relative">
 <Input
 id="signin-password"
 type={showPassword? 'text': 'password'}
 placeholder="Enter your password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 disabled={formLoading || isLoading}
 className="h-10 rounded-sm border-slate-300 bg-white pr-10 text-slate-950 placeholder:text-slate-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
 />

 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="absolute right-0 top-0 h-full px-3 py-2 text-slate-700 hover:bg-transparent hover:text-emerald-800"
 onClick={() => setShowPassword(!showPassword)}
 disabled={formLoading || isLoading}
 >
 {showPassword? (
 <EyeOff className="h-4 w-4" />
 ): (
 <Eye className="h-4 w-4" />
 )}
 </Button>
 </div>
 </div>

 <Button
 type="submit"
 className="h-10 w-full rounded-sm bg-lime-400 font-semibold text-emerald-950 shadow-none hover:bg-lime-300 disabled:bg-lime-200 disabled:text-emerald-950/45"
 disabled={
 formLoading ||
 isLoading ||
 connectionStatus!== 'connected' ||!email ||!password
 }
 >
 {formLoading? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Signing In...
 </>
 ): (
 'Sign In'
 )}
 </Button>
 </TabsContent>

 <TabsContent value="signup" className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="signup-name" className="text-sm font-medium text-slate-800">Full Name</Label>
 <Input
 id="signup-name"
 type="text"
 placeholder="Enter your full name"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 disabled={formLoading || isLoading}
 className="h-10 rounded-sm border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="signup-email" className="text-sm font-medium text-slate-800">Email</Label>
 <Input
 id="signup-email"
 type="email"
 placeholder="Enter your email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={formLoading || isLoading}
 className="h-10 rounded-sm border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="signup-password" className="text-sm font-medium text-slate-800">Password</Label>
 <div className="relative">
 <Input
 id="signup-password"
 type={showPassword? 'text': 'password'}
 placeholder="Enter your password (min. 8 characters)"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 minLength={8}
 disabled={formLoading || isLoading}
 className="h-10 rounded-sm border-slate-300 bg-white pr-10 text-slate-950 placeholder:text-slate-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
 />

 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="absolute right-0 top-0 h-full px-3 py-2 text-slate-700 hover:bg-transparent hover:text-emerald-800"
 onClick={() => setShowPassword(!showPassword)}
 disabled={formLoading || isLoading}
 >
 {showPassword? (
 <EyeOff className="h-4 w-4" />
 ): (
 <Eye className="h-4 w-4" />
 )}
 </Button>
 </div>
 </div>

 <div className="space-y-3">
 <Label className="text-sm font-medium text-slate-800">I am a...</Label>

 <RadioGroup
 value={userType}
 onValueChange={(value: 'recruiter' | 'candidate') => setUserType(value)}
 disabled={formLoading || isLoading}
 >
 <div className="flex items-center space-x-2">
 <RadioGroupItem value="candidate" id="candidate" />
 <Label htmlFor="candidate" className="flex cursor-pointer items-center gap-2 text-slate-800">
 <Users className="h-4 w-4" />
 <div>
 <div className="font-medium">Candidate</div>
 <div className="text-sm text-slate-500">Looking for opportunities</div>
 </div>
 </Label>
 </div>

 <div className="flex items-center space-x-2">
 <RadioGroupItem value="recruiter" id="recruiter" />
 <Label htmlFor="recruiter" className="flex cursor-pointer items-center gap-2 text-slate-800">
 <Briefcase className="h-4 w-4" />
 <div>
 <div className="font-medium">Recruiter</div>
 <div className="text-sm text-slate-500">Hiring talent</div>
 </div>
 </Label>
 </div>
 </RadioGroup>
 </div>

 <Button
 type="submit"
 className="h-10 w-full rounded-sm bg-lime-400 font-semibold text-emerald-950 shadow-none hover:bg-lime-300 disabled:bg-lime-200 disabled:text-emerald-950/45"
 disabled={
 formLoading ||
 isLoading ||
 connectionStatus!== 'connected' ||!name ||!email ||!password ||
 password.length < 8
 }
 >
 {formLoading? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Creating Account...
 </>
 ): (
 'Create Account'
 )}
 </Button>
 </TabsContent>
 </form>
 </Tabs>

 {connectionStatus!== 'connected' && (
 <Card className="bg-yellow-50 border-yellow-200">
 <CardContent className="pt-4">
 <div className="flex items-center gap-2 text-yellow-800">
 <AlertCircle className="h-4 w-4" />
 <span className="text-sm">
 {connectionStatus === 'checking'? 'Connecting to server...': 'Connection issue. Please wait while we reconnect.'}
 </span>
 </div>
 </CardContent>
 </Card>
 )}
 </DialogContent>
 </Dialog>
 );
}




