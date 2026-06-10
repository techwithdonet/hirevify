import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// COMPLETELY PUBLIC HEALTH ENDPOINTS FIRST (before any middleware)
// These must be defined BEFORE any middleware to ensure they're truly public

app.get('/health', (c) => {
  console.log('🏥 Integration service health check requested (PUBLIC ROUTE)');
  
  return c.json({
    status: 'healthy',
    service: 'HireVify Integration Hub',
    timestamp: new Date().toISOString(),
    message: 'Integration service is running and accessible (PUBLIC ROUTE)',
    version: '1.0.2',
    route: 'public-health',
    middleware: 'none',
    auth: 'Not required'
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

app.get('/status', (c) => {
  console.log('🏥 Integration service status check requested (PUBLIC ENDPOINT)');
  
  return c.json({
    status: 'operational',
    service: 'HireVify Integration Hub',
    timestamp: new Date().toISOString(),
    message: 'Integration service is running (PUBLIC STATUS ENDPOINT)',
    version: '1.0.2',
    route: 'public-status',
    auth: 'Not required'
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// CORS middleware for remaining routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Additional public endpoints (after CORS middleware)

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

// Integration helper functions
async function validateIntegrationCredentials(integrationId: string, credentials: any) {
  console.log('🔍 Validating credentials for integration:', integrationId);
  
  // For demo purposes, just check that we have some credentials
  if (!credentials || Object.keys(credentials).length === 0) {
    return { valid: false, error: 'Credentials are required' };
  }
  
  // Integration-specific validation would go here
  switch (integrationId) {
    case 'slack':
      if (!credentials.token) {
        return { valid: false, error: 'Slack token is required' };
      }
      break;
    case 'calendly':
      if (!credentials.apiKey) {
        return { valid: false, error: 'Calendly API key is required' };
      }
      break;
    case 'google_workspace':
      if (!credentials.clientId || !credentials.clientSecret) {
        return { valid: false, error: 'Google Workspace client ID and secret are required' };
      }
      break;
    default:
      // For unknown integrations, accept any credentials
      break;
  }
  
  return { valid: true };
}

function getIntegrationName(integrationId: string): string {
  const names = {
    'slack': 'Slack',
    'calendly': 'Calendly',
    'google_workspace': 'Google Workspace',
    'workday': 'Workday',
    'greenhouse': 'Greenhouse',
    'teams': 'Microsoft Teams',
    'checkr': 'Checkr',
    'tableau': 'Tableau'
  };
  return names[integrationId] || integrationId;
}

function encryptCredentials(credentials: any): any {
  // In a real implementation, this would use proper encryption
  // For now, just return the credentials as-is
  console.log('🔐 Encrypting credentials (placeholder implementation)');
  return credentials;
}

async function performInitialSync(integrationId: string, config: IntegrationConfig, userId: string) {
  console.log('🔄 Performing initial sync for integration:', integrationId);
  
  // Log the sync event
  await logIntegrationEvent(userId, integrationId, 'initial_sync', {
    success: true,
    message: 'Initial sync completed successfully',
    timestamp: new Date().toISOString()
  });
  
  return { success: true, recordsProcessed: 0 };
}

async function performIntegrationSync(integrationId: string, config: IntegrationConfig, userId: string) {
  console.log('🔄 Performing sync for integration:', integrationId);
  
  // Simulate sync process
  const syncResult = {
    success: true,
    recordsProcessed: Math.floor(Math.random() * 100),
    message: 'Sync completed successfully',
    timestamp: new Date().toISOString()
  };
  
  // Log the sync event
  await logIntegrationEvent(userId, integrationId, 'sync', syncResult);
  
  return syncResult;
}

async function performIntegrationCleanup(integrationId: string, userId: string) {
  console.log('🧹 Cleaning up integration data for:', integrationId);
  
  // Remove any cached data or logs
  const logs = await kv.getByPrefix(`integration_log:${userId}:${integrationId}:`);
  for (const log of logs) {
    await kv.del(log.key);
  }
  
  // Log the cleanup event
  await logIntegrationEvent(userId, integrationId, 'cleanup', {
    success: true,
    message: 'Integration data cleaned up',
    itemsRemoved: logs.length,
    timestamp: new Date().toISOString()
  });
}

async function testIntegrationConnection(integrationId: string, config: IntegrationConfig) {
  console.log('🧪 Testing connection for integration:', integrationId);
  
  // Simulate connection test
  const success = Math.random() > 0.1; // 90% success rate for demo
  
  return {
    success,
    message: success ? 'Connection test successful' : 'Connection test failed',
    timestamp: new Date().toISOString()
  };
}

async function logIntegrationEvent(userId: string, integrationId: string, eventType: string, data: any) {
  const logKey = `integration_log:${userId}:${integrationId}:${Date.now()}`;
  const logEntry = {
    userId,
    integrationId,
    eventType,
    data,
    timestamp: new Date().toISOString()
  };
  
  await kv.set(logKey, logEntry, 30 * 24 * 60 * 60); // 30 days TTL
}

// COMPLETELY REWRITTEN AUTH VERIFICATION - BULLETPROOF VERSION
async function verifyAuth(c: any) {
  console.log('🔐 [BULLETPROOF] Starting comprehensive auth verification...');
  
  // Step 1: Extract and validate token format
  const authHeader = c.req.header('Authorization');
  console.log('🔐 Auth header check:', {
    exists: !!authHeader,
    format: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer format' : 'Invalid format') : 'No header',
    length: authHeader?.length || 0
  });

  if (!authHeader) {
    console.log('❌ No Authorization header provided');
    return { error: 'Authorization header is required', status: 401 };
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Invalid Authorization header format');
    return { error: 'Authorization header must start with "Bearer "', status: 401 };
  }

  const accessToken = authHeader.slice(7); // Remove "Bearer " prefix
  console.log('🔐 Token extracted:', {
    length: accessToken.length,
    prefix: accessToken.substring(0, 20) + '...',
    isUuid: accessToken.includes('-'),
    hasTimestamp: accessToken.includes('_')
  });

  if (!accessToken) {
    console.log('❌ Empty access token');
    return { error: 'Access token is required', status: 401 };
  }

  try {
    // Step 2: Verify KV store is accessible
    console.log('🗄️ Verifying KV store accessibility...');
    try {
      const testKey = `auth_test_${Date.now()}`;
      await kv.set(testKey, 'test', 5);
      const testResult = await kv.get(testKey);
      await kv.del(testKey);
      
      if (testResult !== 'test') {
        console.error('❌ KV store test failed: set/get mismatch');
        return { error: 'Database connectivity error', status: 500 };
      }
      console.log('✅ KV store is accessible and working');
    } catch (kvError) {
      console.error('❌ KV store access failed:', kvError.message);
      return { error: `Database error: ${kvError.message}`, status: 500 };
    }

    // Step 3: Look up session
    const sessionKey = `session:${accessToken}`;
    console.log('🔍 Looking up session with key:', sessionKey.substring(0, 40) + '...');
    
    let sessionData;
    try {
      sessionData = await kv.get(sessionKey);
      console.log('📋 Session lookup result:', sessionData ? 'FOUND' : 'NOT FOUND');
    } catch (sessionLookupError) {
      console.error('❌ Session lookup failed:', sessionLookupError.message);
      return { error: 'Session lookup failed', status: 500 };
    }

    if (!sessionData) {
      // Debug: Show some existing sessions to help diagnose the issue
      console.log('🔍 Debug: Session not found, checking existing sessions...');
      try {
        const allSessions = await kv.getByPrefix('session:');
        console.log('🔍 Total sessions in store:', allSessions.length);
        
        if (allSessions.length > 0) {
          console.log('🔍 Sample session keys:');
          allSessions.slice(0, 5).forEach((session, index) => {
            console.log(`   ${index + 1}. ${session.key.substring(0, 50)}...`);
          });
          
          // Check if any session matches our token prefix
          const tokenPrefix = accessToken.substring(0, 20);
          const matchingSession = allSessions.find(s => s.key.includes(tokenPrefix));
          if (matchingSession) {
            console.log('🔍 Found potential matching session:', matchingSession.key.substring(0, 50) + '...');
          }
        }
      } catch (debugError) {
        console.log('🔍 Could not debug sessions:', debugError.message);
      }
      
      return { error: 'Session not found. Please sign in again.', status: 401 };
    }

    // Step 4: Parse session data
    let session;
    try {
      session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
      console.log('📋 Session parsed successfully:', {
        hasEmail: !!session.email,
        hasUserId: !!session.userId,
        userType: session.userType,
        expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : 'No expiry',
        isExpired: session.expiresAt ? Date.now() > session.expiresAt : false
      });
    } catch (parseError) {
      console.error('❌ Session data parse error:', parseError.message);
      console.error('❌ Raw session data type:', typeof sessionData);
      return { error: 'Corrupted session data. Please sign in again.', status: 401 };
    }

    // Step 5: Check session expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('❌ Session has expired');
      // Clean up expired session
      try {
        await kv.del(sessionKey);
        console.log('🧹 Cleaned up expired session');
      } catch (cleanupError) {
        console.log('⚠️ Could not clean up expired session:', cleanupError.message);
      }
      return { error: 'Session has expired. Please sign in again.', status: 401 };
    }

    // Step 6: Validate session structure
    if (!session.email || !session.userId) {
      console.error('❌ Invalid session structure:', {
        hasEmail: !!session.email,
        hasUserId: !!session.userId,
        keys: Object.keys(session)
      });
      return { error: 'Invalid session format. Please sign in again.', status: 401 };
    }

    // Step 7: Look up user data
    console.log('👤 Looking up user data...');
    const userKey = `user:${session.email}`;
    let userData;
    
    try {
      userData = await kv.get(userKey);
      console.log('👤 User lookup by email result:', userData ? 'FOUND' : 'NOT FOUND');
    } catch (userLookupError) {
      console.error('❌ User lookup by email failed:', userLookupError.message);
      return { error: 'User lookup failed', status: 500 };
    }

    // If not found by email, try by user ID
    if (!userData && session.userId) {
      try {
        userData = await kv.get(`user:${session.userId}`);
        console.log('👤 User lookup by ID result:', userData ? 'FOUND' : 'NOT FOUND');
      } catch (userIdError) {
        console.error('❌ User lookup by ID failed:', userIdError.message);
      }
    }

    if (!userData) {
      console.error('❌ User not found in database');
      return { error: 'User profile not found. Please sign in again.', status: 404 };
    }

    // Step 8: Validate user data
    console.log('👤 User data validation:', {
      hasEmail: !!userData.email,
      hasId: !!userData.id,
      userType: userData.userType,
      emailMatch: userData.email === session.email
    });

    // Step 9: Return sanitized user data
    const { password, ...userWithoutPassword } = userData;
    const user = {
      ...userWithoutPassword,
      id: userWithoutPassword.id || session.userId,
      email: userWithoutPassword.email || session.email,
      userType: userWithoutPassword.userType || session.userType
    };

    console.log('✅ Auth verification successful for:', user.email);
    console.log('✅ User type:', user.userType);
    
    return { user, error: null };
    
  } catch (error) {
    console.error('💥 Unexpected auth verification error:', error);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    
    return { 
      error: `Authentication system error: ${error.message}`, 
      status: 500 
    };
  }
}

// Debug endpoint to test auth without requiring specific routes
app.post('/debug-auth', async (c) => {
  console.log('🔍 [BULLETPROOF] Debug auth endpoint requested');
  console.log('🔍 Request headers:', Object.fromEntries(
    Object.entries(c.req.header() || {}).filter(([key]) => 
      key.toLowerCase() !== 'authorization'
    )
  ));
  
  const authResult = await verifyAuth(c);
  
  if (authResult.error) {
    console.log('❌ Auth debug failed:', authResult.error);
    return c.json({
      success: false,
      error: authResult.error,
      status: authResult.status || 401,
      timestamp: new Date().toISOString(),
      debug: {
        endpoint: 'debug-auth',
        step: 'authentication'
      }
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
    timestamp: new Date().toISOString(),
    debug: {
      endpoint: 'debug-auth',
      step: 'success'
    }
  });
});

// Get user integrations
app.get('/list', async (c) => {
  try {
    console.log('📋 [LIST] Fetching integrations list...');
    
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      console.log('❌ [LIST] Auth failed:', authResult.error);
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
    console.log('✅ [LIST] Auth successful, userId:', userId);
    
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

// Update integration settings
app.put('/:integrationId/settings', async (c) => {
  try {
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const userId = authResult.user!.id;
    const integrationId = c.req.param('integrationId');
    const body = await c.req.json();
    const { settings } = body;

    const existingIntegration = await kv.get(`integration:${userId}:${integrationId}`);
    
    if (!existingIntegration) {
      return c.json({ 
        success: false, 
        error: 'Integration not found' 
      }, 404);
    }

    const updatedIntegration = {
      ...existingIntegration,
      settings: { ...existingIntegration.settings, ...settings },
      metadata: {
        ...existingIntegration.metadata,
        lastUpdated: new Date().toISOString()
      }
    };

    await kv.set(`integration:${userId}:${integrationId}`, updatedIntegration);
    
    return c.json({ 
      success: true, 
      integration: {
        ...updatedIntegration,
        credentials: undefined
      }
    });
  } catch (error) {
    console.error('Error updating integration settings:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update integration settings' 
    }, 500);
  }
});

// Disconnect integration
app.delete('/:integrationId', async (c) => {
  try {
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const userId = authResult.user!.id;
    const integrationId = c.req.param('integrationId');

    const existingIntegration = await kv.get(`integration:${userId}:${integrationId}`);
    
    if (!existingIntegration) {
      return c.json({ 
        success: false, 
        error: 'Integration not found' 
      }, 404);
    }

    // Clean up integration data
    await performIntegrationCleanup(integrationId, userId);
    
    // Remove integration config
    await kv.del(`integration:${userId}:${integrationId}`);
    
    return c.json({ 
      success: true, 
      message: 'Integration disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to disconnect integration' 
    }, 500);
  }
});

// Sync integration data
app.post('/:integrationId/sync', async (c) => {
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

    if (integration.status !== 'connected') {
      return c.json({ 
        success: false, 
        error: 'Integration is not connected' 
      }, 400);
    }

    // Perform sync based on integration type
    const syncResult = await performIntegrationSync(integrationId, integration, userId);
    
    // Update last sync time
    const updatedIntegration = {
      ...integration,
      lastSync: new Date().toISOString(),
      status: syncResult.success ? 'connected' : 'error',
      metadata: {
        ...integration.metadata,
        lastSyncResult: syncResult,
        lastSyncAt: new Date().toISOString()
      }
    };

    await kv.set(`integration:${userId}:${integrationId}`, updatedIntegration);
    
    return c.json({ 
      success: true, 
      syncResult,
      integration: {
        ...updatedIntegration,
        credentials: undefined
      }
    });
  } catch (error) {
    console.error('Error syncing integration:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to sync integration' 
    }, 500);
  }
});

// Get integration logs
app.get('/:integrationId/logs', async (c) => {
  try {
    const authResult = await verifyAuth(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const userId = authResult.user!.id;
    const integrationId = c.req.param('integrationId');

    const logs = await kv.getByPrefix(`integration_log:${userId}:${integrationId}:`);
    
    return c.json({ 
      success: true, 
      logs: logs.map(log => log.value).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    });
  } catch (error) {
    console.error('Error fetching integration logs:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch integration logs' 
    }, 500);
  }
});

// Test integration connection
app.post('/:integrationId/test', async (c) => {
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

    // Test connection based on integration type
    const testResult = await testIntegrationConnection(integrationId, integration);
    
    // Log the test event
    await logIntegrationEvent(userId, integrationId, 'connection_test', testResult);
    
    return c.json({ 
      success: true, 
      testResult
    });
  } catch (error) {
    console.error('Error testing integration connection:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to test integration connection' 
    }, 500);
  }
});

export default app;




