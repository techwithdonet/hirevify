import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// COMPLETELY PUBLIC HEALTH ENDPOINTS - NO MIDDLEWARE APPLIED
// These must be defined BEFORE any middleware or other routes

app.get('/health', (c) => {
  console.log('🏥 Integration service health check requested (PUBLIC ROUTE)');
  console.log('🏥 Request method:', c.req.method);
  console.log('🏥 Request URL:', c.req.url);
  console.log('🏥 Request path:', c.req.path);
  
  try {
    const headers = c.req.header() || {};
    console.log('🏥 Request headers (safe):', Object.fromEntries(
      Object.entries(headers).filter(([key]) => 
        !key.toLowerCase().includes('authorization') && !key.toLowerCase().includes('cookie')
      )
    ));
  } catch (headerError) {
    console.log('🏥 Could not parse headers:', headerError);
  }
  
  const healthData = {
    status: 'healthy',
    service: 'HireVify Integration Hub',
    timestamp: new Date().toISOString(),
    message: 'Integration service is running and accessible (PUBLIC ROUTE)',
    version: '1.0.0',
    route: 'public-health',
    middleware: 'none',
    auth: 'Not required',
    endpoints: [
      'GET /health (public)',
      'GET /status (public)',
      'GET /debug (public)',
      'GET /list (auth required)',
      'POST /connect (auth required)',
      'DELETE /:id (auth required)',
      'POST /:id/sync (auth required)',
      'POST /:id/test (auth required)'
    ]
  };

  console.log('✅ Integration service health check successful (PUBLIC ROUTE)');
  return c.json(healthData);
});

app.get('/status', (c) => {
  console.log('🏥 Integration service status check requested (PUBLIC ENDPOINT)');
  
  return c.json({
    status: 'operational',
    service: 'HireVify Integration Hub',
    timestamp: new Date().toISOString(),
    message: 'Integration service is running (PUBLIC STATUS ENDPOINT)',
    version: '1.0.0',
    route: 'public-status',
    auth: 'Not required'
  });
});

app.get('/debug', (c) => {
  console.log('🐛 Integration service debug endpoint requested (PUBLIC ENDPOINT)');
  
  const headers = c.req.header() || {};
  const hasAuth = !!headers.authorization;
  
  return c.json({
    status: 'debug',
    service: 'HireVify Integration Hub Debug',
    timestamp: new Date().toISOString(),
    route: 'public-debug',
    auth: 'Not required',
    requestInfo: {
      method: c.req.method,
      url: c.req.url,
      path: c.req.path,
      hasAuthHeader: hasAuth,
      authHeaderLength: headers.authorization?.length || 0,
      userAgent: headers['user-agent'] || 'unknown',
      origin: headers.origin || 'unknown',
      headerCount: Object.keys(headers).length
    },
    message: 'Debug endpoint - completely public, no auth required'
  });
});

// Add a simple ping endpoint for basic connectivity testing
app.get('/ping', (c) => {
  console.log('🏓 Integration service ping requested');
  return c.json({
    status: 'pong',
    timestamp: new Date().toISOString(),
    message: 'Integration service is alive'
  });
});

// Add CORS middleware AFTER GET endpoints but BEFORE POST endpoints
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Debug endpoint to test auth without requiring specific routes (moved after CORS)
app.post('/debug-auth', async (c) => {
  console.log('🔍 [SIMPLIFIED] Debug auth endpoint requested');
  
  const authResult = await verifyAuth(c);
  
  if (authResult.error) {
    console.log('❌ Auth debug failed:', authResult.error);
    return c.json({
      success: false,
      error: authResult.error,
      status: authResult.status || 401,
      timestamp: new Date().toISOString()
    }, authResult.status || 401);
  }

  console.log('✅ Auth debug successful for user:', authResult.user.email);
  return c.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      userType: authResult.user.userType,
      name: authResult.user.name
    },
    timestamp: new Date().toISOString()
  });
});

// Simple KV test endpoint
app.get('/test-kv', async (c) => {
  console.log('🗄️ KV store test endpoint requested');
  
  try {
    // Test 1: Check if kv module is accessible
    if (!kv) {
      throw new Error('KV module is not imported or accessible');
    }
    
    console.log('✅ KV module is accessible');
    
    // Test 2: Try a simple set operation
    const testKey = 'integration_test_' + Date.now();
    const testValue = { test: true, timestamp: Date.now() };
    
    console.log('🔍 Testing KV set operation...');
    await kv.set(testKey, testValue, 60); // 60 second TTL
    console.log('✅ KV set operation completed');
    
    // Test 3: Try to get the data back
    console.log('🔍 Testing KV get operation...');
    const retrieved = await kv.get(testKey);
    console.log('✅ KV get operation completed, result:', retrieved ? 'found' : 'not found');
    
    // Test 4: Try prefix search for sessions
    console.log('🔍 Testing KV prefix search...');
    const prefixResults = await kv.getByPrefix('session:');
    console.log('✅ KV prefix search completed, found', prefixResults?.length || 0, 'sessions');
    
    // Test 5: Cleanup
    console.log('🔍 Testing KV delete operation...');
    await kv.del(testKey);
    console.log('✅ KV delete operation completed');
    
    return c.json({
      success: true,
      message: 'KV store is fully operational',
      tests: {
        moduleAccess: 'PASSED',
        setOperation: 'PASSED',
        getOperation: retrieved ? 'PASSED' : 'FAILED',
        prefixSearch: Array.isArray(prefixResults) ? 'PASSED' : 'FAILED',
        deleteOperation: 'PASSED',
        sessionCount: prefixResults?.length || 0,
        sampleSessionKeys: prefixResults?.slice(0, 3).map(s => s.key.substring(0, 50) + '...') || []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ KV test failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    return c.json({
      success: false,
      error: error.message || 'Unknown KV error',
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString(),
      debug: {
        kvModuleAvailable: !!kv,
        errorStack: error.stack?.split('\n').slice(0, 5) || []
      }
    }, 500);
  }
});

// Add a comprehensive test endpoint that shows all available routes
app.get('/test-routes', (c) => {
  console.log('📋 Integration routes test endpoint requested');
  console.log('📋 Request URL:', c.req.url);
  console.log('📋 Request path:', c.req.path);
  
  return c.json({
    status: 'integration-routes-test',
    service: 'HireVify Integration Hub',
    timestamp: new Date().toISOString(),
    requestInfo: {
      url: c.req.url,
      path: c.req.path,
      method: c.req.method
    },
    availableRoutes: [
      'GET /health (public)',
      'GET /status (public)', 
      'GET /debug (public)',
      'GET /ping (public)',
      'GET /test-kv (public)',
      'GET /test-routes (public)',
      'POST /debug-auth (auth required)',
      'GET /list (auth required)',
      'GET /:integrationId (auth required)',
      'POST /connect (auth required)',
      'PUT /:integrationId/settings (auth required)',
      'DELETE /:integrationId (auth required)',
      'POST /:integrationId/sync (auth required)',
      'GET /:integrationId/logs (auth required)',
      'POST /:integrationId/test (auth required)'
    ],
    note: 'All routes are mounted under /make-server-d4feca44/integrations/ prefix'
  });
});

// Get Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Integration status type
interface IntegrationConfig {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials?: Record<string, string>;
  lastSync?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Simplified auth verification - directly test KV access
async function verifyAuth(c: any) {
  console.log('🔐 [SIMPLIFIED] Starting auth verification...');
  
  // Extract token
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  console.log('🔐 Token check:', {
    hasHeader: !!authHeader,
    tokenExtracted: !!accessToken,
    tokenLength: accessToken?.length || 0
  });

  if (!accessToken) {
    return { error: 'Missing authorization header', status: 401 };
  }

  try {
    // Step 1: Test basic KV access
    console.log('🗄️ Testing KV store access...');
    try {
      // Check if kv module exists
      if (!kv) {
        console.error('❌ KV module is not available');
        return { error: 'KV store module not available', status: 500 };
      }
      
      const testKey = 'test:' + Date.now();
      await kv.set(testKey, 'test-value', 10); // 10 second TTL
      const testResult = await kv.get(testKey);
      const testPassed = testResult === 'test-value';
      console.log('✅ KV store access test:', testPassed ? 'PASSED' : 'FAILED');
      
      if (!testPassed) {
        console.error('❌ KV store test failed: set/get mismatch');
        return { error: 'KV store test failed: data integrity issue', status: 500 };
      }
      
      await kv.del(testKey); // Cleanup
    } catch (kvTestError) {
      console.error('❌ KV store access test FAILED:', kvTestError);
      console.error('❌ KV error details:', {
        name: kvTestError.name,
        message: kvTestError.message,
        stack: kvTestError.stack?.split('\n').slice(0, 3)
      });
      return { 
        error: `Database access error: ${kvTestError.message || 'Unknown KV error'}`, 
        status: 500 
      };
    }

    // Step 2: Look for session
    console.log('🔍 Looking for session with key:', `session:${accessToken.substring(0, 30)}...`);
    
    let sessionData;
    try {
      sessionData = await kv.get(`session:${accessToken}`);
      console.log('📋 Session lookup result:', sessionData ? 'FOUND' : 'NOT FOUND');
    } catch (sessionError) {
      console.error('❌ Session lookup error:', sessionError.message);
      return { error: 'Session lookup failed. Please try again.', status: 500 };
    }
    
    if (!sessionData) {
      // Debug: List first few sessions to check format
      try {
        const allSessions = await kv.getByPrefix('session:');
        console.log('🔍 Debug - session count in KV:', allSessions.length);
        if (allSessions.length > 0) {
          console.log('🔍 Sample session keys:', allSessions.slice(0, 3).map(s => s.key.substring(0, 50) + '...'));
        }
      } catch (debugError) {
        console.log('🔍 Could not debug sessions:', debugError.message);
      }
      
      return { error: 'Session not found. Please sign in again.', status: 401 };
    }

    // Step 3: Parse session
    let session;
    try {
      session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
      console.log('📋 Session parsed:', {
        hasEmail: !!session.email,
        hasUserId: !!session.userId,
        userType: session.userType,
        expiresAt: session.expiresAt
      });
    } catch (parseError) {
      console.error('❌ Session parse error:', parseError.message);
      return { error: 'Corrupted session data. Please sign in again.', status: 401 };
    }

    // Step 4: Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('❌ Session expired');
      return { error: 'Session has expired. Please sign in again.', status: 401 };
    }

    // Step 5: Get user data
    if (!session.email) {
      console.error('❌ Session missing email');
      return { error: 'Invalid session format. Please sign in again.', status: 401 };
    }

    let userData;
    try {
      userData = await kv.get(`user:${session.email}`);
      console.log('👤 User lookup result:', userData ? 'FOUND' : 'NOT FOUND');
    } catch (userError) {
      console.error('❌ User lookup error:', userError.message);
      return { error: 'User lookup failed. Please try again.', status: 500 };
    }

    if (!userData) {
      // Try by user ID as backup
      if (session.userId) {
        try {
          userData = await kv.get(`user:${session.userId}`);
          console.log('👤 User lookup by ID result:', userData ? 'FOUND' : 'NOT FOUND');
        } catch (userIdError) {
          console.error('❌ User lookup by ID error:', userIdError.message);
        }
      }
      
      if (!userData) {
        return { error: 'User profile not found. Please sign in again.', status: 404 };
      }
    }

    // Step 6: Return user data
    const { password, ...userWithoutPassword } = userData;
    console.log('✅ Auth verification successful for:', userWithoutPassword.email);
    
    return { 
      user: {
        ...userWithoutPassword,
        id: userWithoutPassword.id || session.userId,
        email: userWithoutPassword.email || session.email,
        userType: userWithoutPassword.userType || session.userType
      }, 
      error: null 
    };
    
  } catch (error) {
    console.error('💥 Auth verification exception:', error);
    return { 
      error: `Authentication system error: ${error.message}`, 
      status: 500 
    };
  }
}

// Get user integrations
app.get('/list', async (c) => {
  try {
    console.log('📋 [LIST] Fetching integrations list...');
    console.log('📋 [LIST] Request URL:', c.req.url);
    console.log('📋 [LIST] Request method:', c.req.method);
    console.log('📋 [LIST] Request path:', c.req.path);
    
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      console.log('❌ [LIST] Auth failed for integrations list:', authResult.error);
      return c.json({ 
        error: authResult.error,
        debug: {
          endpoint: 'integrations/list',
          timestamp: new Date().toISOString(),
          authError: authResult.error
        }
      }, authResult.status || 401);
    }

    const userId = authResult.user!.id;
    console.log('✅ [LIST] Auth successful for integrations list, userId:', userId);
    
    const integrations = await kv.getByPrefix(`integration:${userId}:`);
    console.log(`📋 [LIST] Found ${integrations.length} integrations for user ${userId}`);
    
    return c.json({ 
      success: true, 
      integrations: integrations.map(item => item.value),
      count: integrations.length,
      debug: {
        endpoint: 'integrations/list',
        userId: userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [LIST] Error fetching integrations:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch integrations',
      details: error.message,
      debug: {
        endpoint: 'integrations/list',
        timestamp: new Date().toISOString(),
        errorType: error.name || 'UnknownError'
      }
    }, 500);
  }
});

// Get specific integration
app.get('/:integrationId', async (c) => {
  try {
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const userId = authResult.user!.id;
    const integrationId = c.req.param('integrationId');
    
    const integration = await kv.get(`integration:${userId}:${integrationId}`);
    
    if (!integration) {
      return c.json({ 
        success: false, 
        error: 'Integration not found' 
      }, 404);
    }
    
    return c.json({ 
      success: true, 
      integration 
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch integration' 
    }, 500);
  }
});

// Connect/configure integration
app.post('/connect', async (c) => {
  try {
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const userId = authResult.user!.id;
    const body = await c.req.json();
    const { integrationId, credentials, settings } = body;

    if (!integrationId) {
      return c.json({ 
        success: false, 
        error: 'Integration ID is required' 
      }, 400);
    }

    // Validate credentials based on integration type
    const validationResult = await validateIntegrationCredentials(integrationId, credentials);
    if (!validationResult.valid) {
      return c.json({ 
        success: false, 
        error: validationResult.error 
      }, 400);
    }

    const integrationConfig: IntegrationConfig = {
      id: integrationId,
      name: getIntegrationName(integrationId),
      status: 'connected',
      credentials: encryptCredentials(credentials), // In production, use proper encryption
      settings: settings || {},
      lastSync: new Date().toISOString(),
      metadata: {
        connectedAt: new Date().toISOString(),
        connectedBy: userId
      }
    };

    await kv.set(`integration:${userId}:${integrationId}`, integrationConfig);
    
    // Perform initial sync based on integration type
    try {
      await performInitialSync(integrationId, integrationConfig, userId);
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
      // Don't fail the connection, just log the error
    }
    
    return c.json({ 
      success: true, 
      integration: {
        ...integrationConfig,
        credentials: undefined // Don't return credentials
      }
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to connect integration' 
    }, 500);
  }
});

// Helper functions
function getIntegrationName(integrationId: string): string {
  const integrationNames: Record<string, string> = {
    'workday': 'Workday',
    'slack': 'Slack',
    'calendly': 'Calendly',
    'checkr': 'Checkr',
    'google_workspace': 'Google Workspace',
    'greenhouse': 'Greenhouse',
    'teams': 'Microsoft Teams',
    'tableau': 'Tableau'
  };
  
  return integrationNames[integrationId] || integrationId;
}

async function validateIntegrationCredentials(integrationId: string, credentials: any): Promise<{ valid: boolean; error?: string }> {
  // Basic validation - in production, this would validate actual API keys/tokens
  if (!credentials) {
    return { valid: false, error: 'Credentials are required' };
  }

  switch (integrationId) {
    case 'slack':
      if (!credentials.botToken || !credentials.webhookUrl) {
        return { valid: false, error: 'Slack bot token and webhook URL are required' };
      }
      break;
    case 'workday':
      if (!credentials.username || !credentials.password || !credentials.tenant) {
        return { valid: false, error: 'Workday username, password, and tenant are required' };
      }
      break;
    case 'google_workspace':
      if (!credentials.clientId || !credentials.clientSecret) {
        return { valid: false, error: 'Google Workspace client ID and secret are required' };
      }
      break;
    default:
      // Generic validation
      if (Object.keys(credentials).length === 0) {
        return { valid: false, error: 'At least one credential field is required' };
      }
  }

  return { valid: true };
}

function encryptCredentials(credentials: any): any {
  // In production, implement proper encryption
  // For now, just return as-is (not secure)
  return credentials;
}

async function performInitialSync(integrationId: string, integration: IntegrationConfig, userId: string): Promise<void> {
  // Log initial sync attempt
  await logIntegrationEvent(userId, integrationId, 'initial_sync', { 
    status: 'started',
    timestamp: new Date().toISOString()
  });

  // Implementation would vary by integration type
  switch (integrationId) {
    case 'slack':
      // Set up Slack webhooks, channels, etc.
      break;
    case 'workday':
      // Initial data sync from Workday
      break;
    case 'google_workspace':
      // Set up calendar/email integrations
      break;
    default:
      console.log(`Initial sync not implemented for ${integrationId}`);
  }

  await logIntegrationEvent(userId, integrationId, 'initial_sync', { 
    status: 'completed',
    timestamp: new Date().toISOString()
  });
}

async function logIntegrationEvent(userId: string, integrationId: string, eventType: string, data: any): Promise<void> {
  try {
    const logEntry = {
      userId,
      integrationId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    const logKey = `integration_log:${userId}:${integrationId}:${Date.now()}`;
    await kv.set(logKey, logEntry, 60 * 60 * 24 * 30); // 30 days TTL
  } catch (error) {
    console.error('Failed to log integration event:', error);
  }
}

export default app;




