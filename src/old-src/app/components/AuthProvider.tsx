import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'recruiter' | 'candidate';
  isEmailVerified: boolean;
  profileComplete: boolean;
  createdAt: string;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  connectionStatus: 'checking' | 'connected' | 'error';
  signUp: (email: string, password: string, name: string, userType: 'recruiter' | 'candidate') => Promise<{ success: boolean; message: string; user?: User }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Server API base URL
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Enhanced setUser function that keeps tokens synchronized
  const setUserWithTokenSync = (newUser: User | null) => {
    setUser(newUser);
    
    if (newUser) {
      // Ensure token is always synced in localStorage
      if (newUser.accessToken) {
        localStorage.setItem('hirevify_access_token', newUser.accessToken);
        localStorage.setItem('hirevify_user', JSON.stringify(newUser));
      }
    } else {
      // Clear all storage when user is null
      localStorage.removeItem('hirevify_user');
      localStorage.removeItem('hirevify_access_token');
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider: Initializing authentication system...');
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check server connection first
      await checkServerConnection();
      
      // Check for stored session
      await checkStoredSession();
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkServerConnection = async () => {
    try {
      console.log('🌐 Checking server connection...');
      setConnectionStatus('checking');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout
      
      const response = await fetch(`${API_BASE}/auth/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ Server connection successful:', healthData.message);
        setConnectionStatus('connected');
        
        // Show test account info
        if (healthData.testAccounts) {
          console.log('🧪 Test accounts available:', healthData.testAccounts);
        }
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️ Server connection unavailable, running in offline mode');
      setConnectionStatus('error');
      
      // Don't retry automatically - let the app work offline
      // setTimeout(checkServerConnection, 5000);
    }
  };

  const checkStoredSession = async () => {
    try {
      console.log('🔍 Checking for stored session...');
      
      const storedUser = localStorage.getItem('hirevify_user');
      const storedToken = localStorage.getItem('hirevify_access_token');
      
      if (storedUser && storedToken) {
        console.log('📱 Found stored session, verifying...');
        
        const userData = JSON.parse(storedUser);
        
        if (!userData.email || !userData.userType) {
          console.log('❌ Invalid stored user data');
          clearSession();
          return;
        }
        
        // Verify token is still valid
        try {
          const response = await fetch(`${API_BASE}/auth/verify-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: storedToken })
          });

          if (response.ok) {
            const verificationData = await response.json();
            if (verificationData.valid && verificationData.user) {
              const user: User = {
                ...verificationData.user,
                accessToken: storedToken
              };
              setUserWithTokenSync(user);
              console.log('✅ Session restored for:', user.email);
              return;
            }
          }
          
          console.log('❌ Token verification failed');
          clearSession();
          
        } catch (verifyError) {
          console.log('⚠️ Token verification request failed, using offline session');
          userData.accessToken = storedToken;
          setUserWithTokenSync(userData);
        }
      } else {
        console.log('ℹ️ No stored session found');
      }
    } catch (error) {
      console.error('❌ Error checking stored session:', error);
      clearSession();
    }
  };

  const clearSession = () => {
    localStorage.removeItem('hirevify_user');
    localStorage.removeItem('hirevify_access_token');
    setUserWithTokenSync(null);
  };

  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      console.log(`🌐 API call: ${endpoint}`);
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`📡 Response: ${response.status} for ${endpoint}`);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API call failed for ${endpoint}:`, error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, userType: 'recruiter' | 'candidate') => {
    try {
      console.log('📝 Starting signup for:', email.toLowerCase(), userType);
      setIsLoading(true);

      // Validation
      if (!email || !password || !name || !userType) {
        throw new Error('All fields are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await makeApiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, userType })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      // Signup successful
      if (result.user && result.accessToken) {
        const user: User = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          userType: result.user.userType,
          isEmailVerified: true,
          profileComplete: result.user.profileComplete || false,
          createdAt: result.user.createdAt,
          accessToken: result.accessToken
        };

        // Store session
        localStorage.setItem('hirevify_user', JSON.stringify(user));
        localStorage.setItem('hirevify_access_token', result.accessToken);

        setUserWithTokenSync(user);
        console.log('✅ Signup completed for:', user.email);

        return {
          success: true,
          message: result.message || 'Account created successfully! Welcome to HireVify.',
          user
        };
      }

      throw new Error('Invalid response from server');

    } catch (error) {
      console.error('❌ Signup error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Signup failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting signin for:', email.toLowerCase());
      setIsLoading(true);

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // If server is unavailable, use offline mode for test accounts
      if (connectionStatus === 'error') {
        return handleOfflineSignIn(email, password);
      }

      console.log('📤 Sending signin request...');
      const response = await makeApiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password
        })
      });

      const result = await response.json();
      console.log('📥 Signin response:', { status: response.status, hasUser: !!result.user });

      if (!response.ok) {
        console.error('❌ Signin failed with status:', response.status, result);
        throw new Error(result.error || `Sign in failed (${response.status})`);
      }

      // Signin successful
      if (result.user && result.accessToken) {
        const user: User = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          userType: result.user.userType,
          isEmailVerified: result.user.isEmailVerified || true,
          profileComplete: result.user.profileComplete || false,
          createdAt: result.user.createdAt,
          accessToken: result.accessToken
        };

        // Store session
        localStorage.setItem('hirevify_user', JSON.stringify(user));
        localStorage.setItem('hirevify_access_token', result.accessToken);

        setUserWithTokenSync(user);
        console.log('✅ Signin completed for:', user.email);

        return {
          success: true,
          message: result.message || 'Successfully signed in! Welcome back.',
          user
        };
      }

      throw new Error('Invalid response from server');

    } catch (error) {
      console.error('❌ Signin error:', error);
      
      // Fallback to offline mode for test accounts
      if (connectionStatus === 'error') {
        return handleOfflineSignIn(email, password);
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sign in failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Offline mode signin for testing
  const handleOfflineSignIn = async (email: string, password: string) => {
    console.log('🔄 Using offline mode signin...');
    
    // Test account credentials
    const testAccounts = {
      'recruiter@hirevify.com': { password: 'TestPassword123!', userType: 'recruiter' as const, name: 'Test Recruiter' },
      'candidate@hirevify.com': { password: 'TestPassword123!', userType: 'candidate' as const, name: 'Test Candidate' }
    };

    const testAccount = testAccounts[email.toLowerCase() as keyof typeof testAccounts];
    
    if (testAccount && testAccount.password === password) {
      const user: User = {
        id: `offline-${testAccount.userType}-${Date.now()}`,
        email: email.toLowerCase(),
        name: testAccount.name,
        userType: testAccount.userType,
        isEmailVerified: true,
        profileComplete: true,
        createdAt: new Date().toISOString(),
        accessToken: `offline-token-${Date.now()}`
      };

      // Store session
      localStorage.setItem('hirevify_user', JSON.stringify(user));
      localStorage.setItem('hirevify_access_token', user.accessToken);

      setUserWithTokenSync(user);
      console.log('✅ Offline signin completed for:', user.email);

      return {
        success: true,
        message: '✅ Successfully signed in (Offline Mode)! Welcome back.',
        user
      };
    }

    return {
      success: false,
      message: 'Invalid credentials. Use test accounts: recruiter@hirevify.com or candidate@hirevify.com with password: TestPassword123!'
    };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      clearSession();
      console.log('✅ User signed out successfully');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      clearSession(); // Clear anyway
      toast.error('Error signing out, but session cleared');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: setUserWithTokenSync,
        isLoading,
        connectionStatus,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}