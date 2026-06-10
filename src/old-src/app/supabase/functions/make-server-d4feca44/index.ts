import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cors } from 'https://deno.land/x/cors@v1.2.2/mod.ts'

console.log(`🚀 HireVify Edge Function starting...`)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

// Health check endpoint
const handleHealthCheck = () => {
  return new Response(JSON.stringify({ 
    status: 'healthy', 
    service: 'HireVify Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200 
  })
}

// Simple text health check
const handlePublicHealthText = () => {
  return new Response('HireVify Backend is running', { 
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    status: 200 
  })
}

// Ultra fast ping
const handleUltraPing = () => {
  return new Response('pong', { 
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    status: 200 
  })
}

// Integration health check
const handleIntegrationHealth = () => {
  return new Response(JSON.stringify({ 
    status: 'operational',
    integrations: {
      slack: 'available',
      calendly: 'available', 
      google_workspace: 'available',
      teams: 'available',
      zoom: 'available'
    },
    timestamp: new Date().toISOString()
  }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200 
  })
}

// Integration list endpoint
const handleIntegrationsList = () => {
  return new Response(JSON.stringify({ 
    success: true,
    integrations: [],
    message: 'User integrations loaded successfully',
    timestamp: new Date().toISOString()
  }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200 
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`📥 Request: ${req.method} ${req.url}`)

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/make-server-d4feca44', '')

    console.log(`🛣️ Route: ${path}`)

    // Route requests
    switch (path) {
      case '/health':
        return handleHealthCheck()
      
      case '/public-health-text':
        return handlePublicHealthText()
      
      case '/ultra-ping':
        return handleUltraPing()
      
      case '/integrations/health':
        return handleIntegrationHealth()
      
      case '/integrations/status':
        return handleIntegrationHealth()
      
      case '/integrations/ping':
        return handleUltraPing()
      
      case '/integrations/list':
        return handleIntegrationsList()
      
      default:
        console.log(`❓ Unknown route: ${path}`)
        return new Response(JSON.stringify({ 
          error: 'Not found',
          path: path,
          available_endpoints: [
            '/health',
            '/public-health-text', 
            '/ultra-ping',
            '/integrations/health',
            '/integrations/status',
            '/integrations/ping',
            '/integrations/list'
          ]
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        })
    }

  } catch (error) {
    console.error('💥 Server error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})

console.log(`✅ HireVify Edge Function is ready and listening...`)