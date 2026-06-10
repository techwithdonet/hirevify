import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton pattern to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  // Return existing instance if it exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance only if none exists
  const supabaseUrl = `https://${projectId}.supabase.co`;
  
  console.log('🔧 Creating new Supabase client instance');
  
  supabaseInstance = createSupabaseClient(supabaseUrl, publicAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Prevents URL-based session detection conflicts
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'hirevify-auth-token', // Unique storage key for this app
      flowType: 'pkce' // Use PKCE flow for better security
    },
    global: {
      headers: {
        'X-Client-Info': 'hirevify-web-app'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  console.log('✅ Supabase client instance created successfully');
  
  return supabaseInstance;
}

// Function to reset the singleton (useful for testing or logout)
export function resetClient() {
  console.log('🔄 Resetting Supabase client instance');
  supabaseInstance = null;
}

// Function to check if client is initialized
export function isClientInitialized() {
  return supabaseInstance !== null;
}

// Export the singleton instance for direct use (be careful with this)
export function getClientInstance() {
  if (!supabaseInstance) {
    return createClient();
  }
  return supabaseInstance;
}