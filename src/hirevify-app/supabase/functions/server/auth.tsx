import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import crypto from 'node:crypto';

const auth = new Hono();

// CORS configuration
auth.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Session configuration
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Normalize email to lowercase for consistent storage/lookup
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Generate a secure session token
function generateSessionToken(): string {
  return crypto.randomUUID() + '_' + Date.now();
}

// Hash password using SHA-256 with consistent salt - SUPER SIMPLE VERSION
function hashPassword(password: string): string {
  // Use a very simple, consistent salt for test accounts
  const salt = 'hirevify_simple_salt_2024';
  const combined = password + salt;
  const hash = crypto.createHash('sha256').update(combined, 'utf8').digest('hex');
  console.log(`🔐 Hashing password: "${password}" -> "${hash.substring(0, 16)}..."`);
  return hash;
}

// Verify password - SUPER SIMPLE VERSION
function verifyPassword(password: string, hashedPassword: string): boolean {
  const newHash = hashPassword(password);
  const matches = newHash === hashedPassword;
  console.log(`🔐 Verifying password: "${password}" -> hash matches: ${matches}`);
  if (!matches) {
    console.log(`   Expected: ${hashedPassword.substring(0, 16)}...`);
    console.log(`   Got:      ${newHash.substring(0, 16)}...`);
  }
  return matches;
}

// Create test accounts on server startup - bulletproof implementation
async function ensureTestAccountsExist() {
  console.log('🔧 Ensuring test accounts exist...');
  
  const testAccounts = [
    {
      email: 'recruiter@hirevify.com',
      password: 'TestPassword123!',
      name: 'Test Recruiter',
      userType: 'recruiter'
    },
    {
      email: 'candidate@hirevify.com',
      password: 'TestPassword123!',
      name: 'Test Candidate',
      userType: 'candidate'
    }
  ];

  for (const account of testAccounts) {
    const normalizedEmail = normalizeEmail(account.email);
    
    try {
      // Check if account already exists
      let existingUser = await kv.get(`user:${normalizedEmail}`);
      
      if (existingUser) {
        // Verify password works with existing account
        const passwordCheck = verifyPassword(account.password, existingUser.password);
        
        if (passwordCheck) {
          console.log(`✅ Test account ${normalizedEmail} already exists and password is correct`);
          continue;
        } else {
          console.log(`🔧 Test account ${normalizedEmail} exists but password needs fixing`);
        }
      }
      
      // Create or recreate account
      const userId = existingUser?.id || `user_${crypto.randomUUID()}`;
      const hashedPassword = hashPassword(account.password);
      
      const userData = {
        id: userId,
        email: normalizedEmail,
        name: account.name,
        userType: account.userType,
        password: hashedPassword,
        isEmailVerified: true,
        profileComplete: false,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        lastSignIn: new Date().toISOString(),
        projects: existingUser?.projects || [],
        applications: existingUser?.applications || []
      };

      // Store user data
      await kv.set(`user:${normalizedEmail}`, userData);
      await kv.set(`user:${userId}`, userData);
      
      // Verify the password works after storing
      const finalPasswordCheck = verifyPassword(account.password, hashedPassword);
      console.log(`✅ Test account ${normalizedEmail} ${existingUser ? 'updated' : 'created'} (password verification: ${finalPasswordCheck})`);
      
      // Double check we can retrieve and verify
      const storedUser = await kv.get(`user:${normalizedEmail}`);
      if (storedUser && verifyPassword(account.password, storedUser.password)) {
        console.log(`✅ Test account ${normalizedEmail} storage verification successful`);
      } else {
        console.error(`❌ Test account ${normalizedEmail} storage verification failed`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to create test account ${normalizedEmail}:`, error);
    }
  }
}

// Initialize test accounts immediately
ensureTestAccountsExist();

// Health check endpoint - also ensures test accounts
auth.get('/health', async (c) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Ensure test accounts exist on every health check
    await ensureTestAccountsExist();
    
    // Test database connectivity
    const userKeys = await kv.getByPrefix('user:');
    
    return c.json({
      status: 'healthy',
      timestamp,
      database: {
        connected: true,
        userCount: userKeys.length
      },
      message: 'HireVify Authentication Service is running',
      testAccounts: {
        recruiter: 'recruiter@hirevify.com / TestPassword123!',
        candidate: 'candidate@hirevify.com / TestPassword123!'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Authentication service is experiencing issues'
    }, 500);
  }
});

// Sign up endpoint - bulletproof implementation
auth.post('/signup', async (c) => {
  try {
    const { email, password, name, userType } = await c.req.json();
    const normalizedEmail = normalizeEmail(email);
    
    console.log(`📝 Signup request for: ${normalizedEmail} (${userType})`);
    
    // Validation
    if (!email || !password || !name || !userType) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    
    if (!['recruiter', 'candidate'].includes(userType)) {
      return c.json({ error: 'Invalid user type' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }
    
    // Check if user already exists
    const existingUser = await kv.get(`user:${normalizedEmail}`);
    if (existingUser && !normalizedEmail.includes('@hirevify.com')) {
      // Allow test account recreation
      console.log(`❌ User already exists: ${normalizedEmail}`);
      return c.json({ 
        error: 'An account with this email already exists. Please sign in instead.' 
      }, 400);
    }
    
    // Create user account
    const userId = `user_${crypto.randomUUID()}`;
    const hashedPassword = hashPassword(password);
    
    const userData = {
      id: userId,
      email: normalizedEmail,
      name: name,
      userType: userType,
      password: hashedPassword,
      isEmailVerified: true,
      profileComplete: false,
      createdAt: new Date().toISOString(),
      lastSignIn: new Date().toISOString(),
      projects: [],
      applications: []
    };
    
    // Store user data
    await kv.set(`user:${normalizedEmail}`, userData);
    await kv.set(`user:${userId}`, userData);
    
    // Generate access token
    const accessToken = generateSessionToken();
    const session = {
      userId,
      email: normalizedEmail,
      accessToken,
      userType: userType,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY
    };
    
    const sessionKey = `session:${accessToken}`;
    const sessionValue = JSON.stringify(session);
    console.log('💾 Storing signup session:', {
      key: sessionKey.substring(0, 30) + '...',
      userId,
      email: normalizedEmail,
      userType,
      valueLength: sessionValue.length,
      expirySeconds: Math.floor(SESSION_EXPIRY / 1000)
    });
    
    await kv.set(sessionKey, sessionValue, Math.floor(SESSION_EXPIRY / 1000));
    
    console.log(`✅ User account created: ${normalizedEmail} (${userType})`);
    
    // Return user data without password
    const { password: userPassword, ...userWithoutPassword } = userData;
    
    return c.json({
      message: 'Account created successfully! Welcome to HireVify.',
      user: userWithoutPassword,
      accessToken
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Registration failed. Please try again.' }, 500);
  }
});

// Sign in endpoint - bulletproof implementation
auth.post('/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const normalizedEmail = normalizeEmail(email);
    
    console.log(`🔐 Signin attempt for: ${normalizedEmail}`);
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return c.json({ error: 'Please enter a valid email address' }, 400);
    }

    // For test accounts, always ensure they exist first
    if (normalizedEmail === 'recruiter@hirevify.com' || normalizedEmail === 'candidate@hirevify.com') {
      console.log(`🔧 Ensuring test account exists: ${normalizedEmail}`);
      await ensureTestAccountsExist();
    }

    // Get user
    let user = await kv.get(`user:${normalizedEmail}`);
    
    if (!user) {
      console.log(`❌ No user found for email: ${normalizedEmail}`);
      return c.json({ 
        error: 'No account found with this email. Please sign up first, or use test accounts: recruiter@hirevify.com or candidate@hirevify.com with password: TestPassword123!' 
      }, 404);
    }
    
    console.log(`🔍 User found: ${normalizedEmail}, checking password...`);
    console.log(`🔐 Stored password hash (first 16 chars): ${user.password?.substring(0, 16)}...`);
    
    // Verify password
    let isPasswordValid = verifyPassword(password, user.password);
    console.log(`🔐 Initial password verification for ${normalizedEmail}: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
    
    if (!isPasswordValid) {
      // For test accounts, regenerate the password hash to fix any issues
      if (normalizedEmail.includes('@hirevify.com') && password === 'TestPassword123!') {
        console.log(`🔧 Regenerating password hash for test account: ${normalizedEmail}`);
        
        // Generate new hash
        const newHashedPassword = hashPassword(password);
        console.log(`🔐 New password hash (first 16 chars): ${newHashedPassword.substring(0, 16)}...`);
        
        // Update user
        user.password = newHashedPassword;
        await kv.set(`user:${normalizedEmail}`, user);
        await kv.set(`user:${user.id}`, user);
        
        // Test the new hash
        isPasswordValid = verifyPassword(password, newHashedPassword);
        console.log(`✅ Password hash regenerated for ${normalizedEmail}, verification: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
      }
    }
    
    if (!isPasswordValid) {
      console.log(`❌ Final password verification failed for: ${normalizedEmail}`);
      
      // For test accounts, provide detailed debug info
      if (normalizedEmail.includes('@hirevify.com')) {
        const testHash = hashPassword('TestPassword123!');
        console.log(`🔍 Debug info for ${normalizedEmail}:`);
        console.log(`   - Input password: TestPassword123!`);
        console.log(`   - Stored hash: ${user.password}`);
        console.log(`   - Test hash: ${testHash}`);
        console.log(`   - Hashes match: ${user.password === testHash}`);
      }
      
      return c.json({ 
        error: 'Invalid email or password. For test accounts, use: recruiter@hirevify.com or candidate@hirevify.com with password: TestPassword123!' 
      }, 401);
    }
    
    // Generate access token
    const accessToken = generateSessionToken();
    const session = {
      userId: user.id,
      email: normalizedEmail,
      accessToken,
      userType: user.userType,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY
    };
    
    const sessionKey = `session:${accessToken}`;
    const sessionValue = JSON.stringify(session);
    console.log('💾 Storing signin session:', {
      key: sessionKey.substring(0, 30) + '...',
      userId: user.id,
      email: normalizedEmail,
      userType: user.userType,
      valueLength: sessionValue.length,
      expirySeconds: Math.floor(SESSION_EXPIRY / 1000)
    });
    
    await kv.set(sessionKey, sessionValue, Math.floor(SESSION_EXPIRY / 1000));
    
    // Update last sign in
    user.lastSignIn = new Date().toISOString();
    await kv.set(`user:${normalizedEmail}`, user);
    await kv.set(`user:${user.id}`, user);
    
    const { password: userPassword, ...userWithoutPassword } = user;
    
    console.log(`✅ Signin successful for: ${normalizedEmail}`);
    
    return c.json({
      message: 'Successfully signed in!',
      user: userWithoutPassword,
      accessToken
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ error: 'Sign in failed. Please try again.' }, 500);
  }
});

// Verify token endpoint
auth.post('/verify-token', async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }
    
    const sessionData = await kv.get(`session:${token}`);
    if (!sessionData) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    const session = JSON.parse(sessionData);
    
    // Check if token is expired
    if (Date.now() > session.expiresAt) {
      await kv.del(`session:${token}`);
      return c.json({ error: 'Token has expired' }, 401);
    }
    
    // Get user data
    const user = await kv.get(`user:${session.email}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const { password, ...userWithoutPassword } = user;
    
    return c.json({
      valid: true,
      user: userWithoutPassword,
      session: {
        userId: session.userId,
        email: session.email,
        userType: session.userType,
        expiresAt: session.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ error: 'Token verification failed' }, 500);
  }
});

// Reset test accounts endpoint - forces recreation
auth.post('/reset-test-accounts', async (c) => {
  try {
    console.log('🔧 Force resetting test accounts...');
    
    const testAccounts = [
      {
        email: 'recruiter@hirevify.com',
        password: 'TestPassword123!',
        name: 'Test Recruiter',
        userType: 'recruiter'
      },
      {
        email: 'candidate@hirevify.com',
        password: 'TestPassword123!',
        name: 'Test Candidate',
        userType: 'candidate'
      }
    ];

    const resetResults = [];

    for (const account of testAccounts) {
      const normalizedEmail = normalizeEmail(account.email);
      
      try {
        // Force delete existing accounts
        const existingUser = await kv.get(`user:${normalizedEmail}`);
        if (existingUser) {
          await kv.del(`user:${normalizedEmail}`);
          await kv.del(`user:${existingUser.id}`);
          console.log(`🗑️ Deleted existing test account: ${normalizedEmail}`);
        }
        
        // Create fresh account
        const userId = `user_${crypto.randomUUID()}`;
        const hashedPassword = hashPassword(account.password);
        
        const userData = {
          id: userId,
          email: normalizedEmail,
          name: account.name,
          userType: account.userType,
          password: hashedPassword,
          isEmailVerified: true,
          profileComplete: false,
          createdAt: new Date().toISOString(),
          lastSignIn: new Date().toISOString(),
          projects: [],
          applications: []
        };

        // Store user data
        await kv.set(`user:${normalizedEmail}`, userData);
        await kv.set(`user:${userId}`, userData);
        
        // Verify password immediately
        const passwordCheck = verifyPassword(account.password, hashedPassword);
        
        resetResults.push({
          email: normalizedEmail,
          success: passwordCheck,
          message: passwordCheck ? 'Account reset successfully' : 'Password verification failed'
        });
        
        console.log(`✅ Test account ${normalizedEmail} force reset (verification: ${passwordCheck})`);
        
      } catch (error) {
        console.error(`❌ Failed to reset test account ${normalizedEmail}:`, error);
        resetResults.push({
          email: normalizedEmail,
          success: false,
          message: `Error: ${error.message}`
        });
      }
    }
    
    return c.json({
      message: 'Test accounts have been force reset',
      results: resetResults,
      accounts: [
        { email: 'recruiter@hirevify.com', password: 'TestPassword123!' },
        { email: 'candidate@hirevify.com', password: 'TestPassword123!' }
      ]
    });
  } catch (error) {
    console.error('Reset test accounts error:', error);
    return c.json({ error: 'Failed to reset test accounts' }, 500);
  }
});

// Debug endpoint to check user
auth.post('/debug-user', async (c) => {
  try {
    const { email } = await c.req.json();
    const normalizedEmail = normalizeEmail(email);
    
    const user = await kv.get(`user:${normalizedEmail}`);
    
    if (!user) {
      return c.json({
        exists: false,
        email: normalizedEmail,
        message: 'User not found'
      });
    }
    
    const { password, ...userWithoutPassword } = user;
    
    // For test accounts, also show if password verification works
    let passwordWorks = false;
    if (normalizedEmail.includes('@hirevify.com')) {
      passwordWorks = verifyPassword('TestPassword123!', user.password);
    }
    
    return c.json({
      exists: true,
      email: normalizedEmail,
      user: userWithoutPassword,
      passwordHash: user.password ? user.password.substring(0, 16) + '...' : 'No password',
      passwordWorksWithTestPassword: passwordWorks,
      debugInfo: {
        fullHash: user.password,
        testPasswordHash: normalizedEmail.includes('@hirevify.com') ? hashPassword('TestPassword123!') : null
      }
    });
    
  } catch (error) {
    console.error('Debug user error:', error);
    return c.json({ error: 'Debug failed' }, 500);
  }
});

// Quick test endpoint for debugging
auth.get('/test-password-hash', async (c) => {
  try {
    const testPassword = 'TestPassword123!';
    const hash1 = hashPassword(testPassword);
    const hash2 = hashPassword(testPassword);
    const verification = verifyPassword(testPassword, hash1);
    
    return c.json({
      testPassword,
      hash1,
      hash2,
      hashesMatch: hash1 === hash2,
      verification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test password hash error:', error);
    return c.json({ error: 'Test failed' }, 500);
  }
});

// Debug endpoint to check sessions
auth.post('/debug-session', async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }
    
    console.log('🔍 Debugging session for token:', token.substring(0, 20) + '...');
    
    // Check if session exists
    const sessionData = await kv.get(`session:${token}`);
    console.log('🔍 Session lookup result:', sessionData ? 'found' : 'not found');
    
    if (!sessionData) {
      // List all sessions to debug
      const allSessions = await kv.getByPrefix('session:');
      console.log('🔍 All sessions in KV store:', allSessions.length);
      
      return c.json({
        exists: false,
        token: token.substring(0, 20) + '...',
        message: 'Session not found',
        debug: {
          totalSessions: allSessions.length,
          sessionKeys: allSessions.slice(0, 5).map(s => s.key.substring(0, 40) + '...')
        }
      });
    }
    
    let session;
    try {
      session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    } catch (parseError) {
      return c.json({
        exists: true,
        error: 'Session data corrupted',
        rawData: typeof sessionData,
        parseError: parseError.message
      });
    }
    
    // Check if user exists
    const userData = session.email ? await kv.get(`user:${session.email}`) : null;
    
    return c.json({
      exists: true,
      session: {
        userId: session.userId,
        email: session.email,
        userType: session.userType,
        createdAt: new Date(session.createdAt).toISOString(),
        expiresAt: new Date(session.expiresAt).toISOString(),
        isExpired: Date.now() > session.expiresAt
      },
      user: {
        exists: !!userData,
        email: userData?.email,
        userType: userData?.userType
      }
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    return c.json({ error: 'Debug failed' }, 500);
  }
});

// Get all candidates endpoint for AI matching
auth.get('/candidates', async (c) => {
  try {
    console.log('🔍 Fetching all candidates for AI matching...');
    
    // Get all users and filter for candidates
    const userKeys = await kv.getByPrefix('user:');
    const candidates = [];
    
    for (const userKey of userKeys) {
      // Skip email-based keys, only process ID-based keys to avoid duplicates
      if (!userKey.key.includes('@')) {
        const user = userKey.value;
        if (user && user.userType === 'candidate') {
          // Transform to AI matching format and exclude sensitive data
          const { password, ...userWithoutPassword } = user;
          candidates.push(userWithoutPassword);
        }
      }
    }
    
    console.log(`✅ Found ${candidates.length} candidates`);
    
    return c.json({
      success: true,
      candidates,
      count: candidates.length
    });
    
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch candidates',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get specific candidate endpoint
auth.get('/candidates/:id', async (c) => {
  try {
    const candidateId = c.req.param('id');
    console.log(`🔍 Fetching candidate: ${candidateId}`);
    
    const candidate = await kv.get(`user:${candidateId}`);
    
    if (!candidate) {
      console.log(`❌ Candidate not found: ${candidateId}`);
      return c.json({ 
        success: false,
        error: 'Candidate not found' 
      }, 404);
    }
    
    if (candidate.userType !== 'candidate') {
      return c.json({ 
        success: false,
        error: 'User is not a candidate' 
      }, 400);
    }
    
    // Remove sensitive data
    const { password, ...candidateWithoutPassword } = candidate;
    
    console.log(`✅ Candidate found: ${candidateId}`);
    
    return c.json({
      success: true,
      candidate: candidateWithoutPassword
    });
    
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch candidate',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default auth;




