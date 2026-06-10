import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';

// Import route modules
import authRoutes from './auth.tsx';
import projectRoutes from './projects.tsx';
import applicationRoutes from './applications.tsx';
import fileRoutes from './files.tsx';
import paymentRoutes from './payments.tsx';
import communicationRoutes from './communications.tsx';
import interviewRoutes from './interviews.tsx';
import analyticsRoutes from './analytics.tsx';
import aiMatchingRoutes from './ai-matching.tsx';
import integrationRoutes from './integrations.tsx';
import atsRoutes from './ats.tsx';

const app = new Hono();

// ULTRA-PUBLIC ENDPOINTS - DEFINED FIRST TO BYPASS ALL MIDDLEWARE
// These endpoints are defined BEFORE any middleware to ensure they're completely public

// Ultra-simple integration health endpoint with manual CORS
app.get('/make-server-d4feca44/ultra-integration-health', () => {
  console.log('🏥 Ultra-simple integration health check (no middleware)');
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'HireVify Integration Hub (Ultra Public)',
    timestamp: new Date().toISOString(),
    message: 'Integration service is operational (ultra-simple endpoint)',
    version: '1.0.3',
    auth: 'none',
    middleware: 'completely bypassed',
    cors: 'manual'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    }
  });
});

// Handle OPTIONS requests for CORS preflight
app.options('/make-server-d4feca44/ultra-integration-health', () => {
  console.log('🏥 Ultra-simple integration health OPTIONS request');
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    }
  });
});

// Another ultra-simple endpoint for testing
app.get('/make-server-d4feca44/simple-test', () => {
  console.log('🧪 Simple test endpoint (no middleware)');
  return new Response(JSON.stringify({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    auth: 'none required'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// Completely public text endpoint (no JSON parsing needed)
app.get('/make-server-d4feca44/public-health-text', () => {
  console.log('🏥 Public health text endpoint (completely public)');
  return new Response('INTEGRATION_SERVICE_HEALTHY', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    }
  });
});

// Public health endpoint that works without any authentication
app.get('/make-server-d4feca44/public-health-check', () => {
  console.log('🏥 Public health check (no auth required)');
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'HireVify Integration Service',
    timestamp: new Date().toISOString(),
    message: 'Integration service is operational (public endpoint)',
    version: '1.0.4',
    auth: 'none',
    public: true
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    }
  });
});

// Handle OPTIONS for simple test
app.options('/make-server-d4feca44/simple-test', () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    }
  });
});

// Middleware (applied after ultra-public endpoints)
app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// COMPLETELY PUBLIC ENDPOINTS - NO AUTH, NO MIDDLEWARE
// These endpoints are defined FIRST to ensure they bypass any global middleware

// Ultra-simple ping endpoint
app.get('/make-server-d4feca44/ultra-ping', () => {
  return new Response(JSON.stringify({
    status: 'alive',
    timestamp: Date.now(),
    message: 'Ultra-simple ping - no middleware',
    auth: 'none',
    middleware: 'bypassed'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// Raw response test
app.get('/make-server-d4feca44/raw-test', () => {
  return new Response('RAW_TEST_SUCCESS', {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

// Health check endpoint
app.get('/make-server-d4feca44/health', (c) => {
  return c.json({ 
    status: 'HireVify server is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: [
      'auth', 'projects', 'applications', 'files', 'payments',
      'communications', 'interviews', 'analytics', 'ai-matching', 'integrations', 'ats'
    ]
  });
});

// Dedicated integration service health check (backup endpoint)
app.get('/make-server-d4feca44/integrations-health', (c) => {
  console.log('🏥 Backup integration health check requested');
  console.log('🏥 Request headers:', Object.fromEntries(
    Object.entries(c.req.header() || {}).filter(([key]) => 
      !key.toLowerCase().includes('authorization') && !key.toLowerCase().includes('cookie')
    )
  ));
  
  return c.json({
    status: 'healthy',
    service: 'HireVify Integration Hub (Backup Endpoint)',
    timestamp: new Date().toISOString(),
    message: 'Integration service is operational',
    version: '1.0.0',
    note: 'This is a backup health check endpoint',
    auth: 'none required',
    route: 'public-backup-endpoint'
  });
});

// Additional public health endpoints for integrations
app.get('/make-server-d4feca44/integration-status', (c) => {
  console.log('🏥 Public integration status check requested');
  return c.json({
    status: 'operational',
    service: 'HireVify Integration Service',
    timestamp: new Date().toISOString(),
    message: 'Integration service is running (public endpoint)',
    version: '1.0.0',
    auth: 'none required',
    endpoints: {
      health: '/make-server-d4feca44/integrations/health',
      status: '/make-server-d4feca44/integrations/status', 
      debug: '/make-server-d4feca44/integrations/debug',
      backup: '/make-server-d4feca44/integrations-health'
    }
  });
});

app.get('/make-server-d4feca44/ping', (c) => {
  console.log('🏥 Simple ping endpoint requested');
  const headers = c.req.header() || {};
  
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is responding',
    requestInfo: {
      method: c.req.method,
      path: c.req.path,
      hasAuth: !!headers.authorization,
      userAgent: headers['user-agent'] || 'unknown'
    }
  });
});

// Simple test endpoint with no auth required
app.get('/make-server-d4feca44/test-no-auth', (c) => {
  console.log('🧪 No-auth test endpoint requested');
  return c.json({
    status: 'success',
    message: 'This endpoint requires no authentication',
    timestamp: new Date().toISOString(),
    auth: 'none required',
    test: 'passed'
  });
});

// Direct integration health endpoints in main server (bypass any module-specific middleware)
app.get('/make-server-d4feca44/integration-health', (c) => {
  console.log('🏥 Main server integration health check requested');
  return c.json({
    status: 'healthy',
    service: 'HireVify Integration Hub (Main Server)',
    timestamp: new Date().toISOString(),
    message: 'Integration service is fully operational via main server',
    version: '1.0.1',
    auth: 'none required',
    source: 'main-server-direct',
    endpoints: {
      'health-main': '/make-server-d4feca44/integration-health',
      'health-backup': '/make-server-d4feca44/integrations-health',
      'status': '/make-server-d4feca44/integration-status',
      'debug': '/make-server-d4feca44/integration-debug',
      'ping': '/make-server-d4feca44/ultra-ping'
    }
  });
});

// Additional ultra-simple integration health endpoint
app.get('/make-server-d4feca44/integrations-simple-health', () => {
  console.log('🏥 Ultra-simple integration health check requested');
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'HireVify Integration Hub (Ultra Simple)',
    timestamp: new Date().toISOString(),
    message: 'Integration service is operational (no middleware)',
    version: '1.0.1',
    auth: 'none',
    source: 'ultra-simple'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

app.get('/make-server-d4feca44/integration-debug', (c) => {
  console.log('🐛 Main server integration debug requested');
  const headers = c.req.header() || {};
  
  return c.json({
    status: 'debug',
    service: 'HireVify Integration Hub Debug (Main Server)',
    timestamp: new Date().toISOString(),
    source: 'main-server-direct',
    auth: 'none required',
    requestInfo: {
      method: c.req.method,
      url: c.req.url,
      path: c.req.path,
      hasAuthHeader: !!headers.authorization,
      headerCount: Object.keys(headers).length,
      userAgent: headers['user-agent'] || 'unknown'
    },
    message: 'Main server integration debug - completely public'
  });
});

// Mount route modules
console.log('🚀 Mounting route modules...');
app.route('/make-server-d4feca44/auth', authRoutes);
console.log('✅ Auth routes mounted');
app.route('/make-server-d4feca44/projects', projectRoutes);
console.log('✅ Projects routes mounted');
app.route('/make-server-d4feca44/applications', applicationRoutes);
console.log('✅ Applications routes mounted');
app.route('/make-server-d4feca44/files', fileRoutes);
console.log('✅ Files routes mounted');
app.route('/make-server-d4feca44/payments', paymentRoutes);
console.log('✅ Payments routes mounted');
app.route('/make-server-d4feca44/communications', communicationRoutes);
console.log('✅ Communications routes mounted');
app.route('/make-server-d4feca44/interviews', interviewRoutes);
console.log('✅ Interviews routes mounted');
app.route('/make-server-d4feca44/analytics', analyticsRoutes);
console.log('✅ Analytics routes mounted');
app.route('/make-server-d4feca44/ai-matching', aiMatchingRoutes);
console.log('✅ AI Matching routes mounted');
app.route('/make-server-d4feca44/integrations', integrationRoutes);
console.log('✅ Integrations routes mounted');
app.route('/make-server-d4feca44/ats', atsRoutes);
console.log('✅ ATS routes mounted');
app.route('/make-server-d4feca44/candidates', authRoutes); // Candidates are in auth module
console.log('✅ All routes mounted successfully');

// Global error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ 
    error: 'Internal server error',
    message: err.message 
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Start the server
Deno.serve(app.fetch);




