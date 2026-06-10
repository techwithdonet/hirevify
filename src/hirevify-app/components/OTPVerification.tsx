import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { ArrowLeft, RefreshCw, Mail, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface OTPVerificationProps {
  email: string;
  type: 'signup' | 'signin';
  onBack: () => void;
  onVerify: (otp: string) => Promise<{ success: boolean; message: string; user?: any }>;
  onResend: () => Promise<{ success: boolean; message: string }>;
}

export function OTPVerification({ email, type, onBack, onVerify, onResend }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, ''); // Remove non-digits
    
    if (pastedText.length === 6) {
      const newOtp = pastedText.split('');
      setOtp(newOtp);
      setError('');
      // Auto-submit pasted OTP
      handleVerify(pastedText);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await onVerify(code);
      
      if (result.success) {
        toast.success(result.message);
        // Success is handled by parent component
      } else {
        setError(result.message);
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      const result = await onResend();
      
      if (result.success) {
        toast.success(result.message);
        setTimeLeft(15 * 60); // Reset timer
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to resend code. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;
  const otpFilled = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl">
              {type === 'signup' ? 'Verify Your Email' : 'Verify Sign In'}
            </CardTitle>
            <CardDescription className="mt-2">
              {type === 'signup' 
                ? 'Enter the 6-digit verification code sent to your email to complete your registration.'
                : 'Enter the 6-digit verification code sent to your email to sign in securely.'
              }
            </CardDescription>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="font-medium">{email}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInputChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={`font-medium ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isExpired ? 'Code expired' : `Expires in ${formatTime(timeLeft)}`}
            </span>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            disabled={!otpFilled || isVerifying || isExpired}
            className="w-full"
            size="lg"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                {type === 'signup' ? 'Create Account' : 'Sign In'}
              </>
            )}
          </Button>

          {/* Resend Section */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>

            {!canResend && !isExpired && (
              <p className="text-xs text-muted-foreground">
                You can request a new code in {formatTime(timeLeft)}
              </p>
            )}
          </div>

          {/* Security Note */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Security Note</p>
                <p>
                  This verification code was sent to your email for security. 
                  Never share this code with anyone.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





