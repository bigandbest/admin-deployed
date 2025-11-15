// Deprecated: Supabase direct access is no longer used
// All authentication now goes through backend API

console.warn('⚠️ Direct Supabase access is deprecated. Use backend API instead.');

// Mock Supabase client to prevent errors in legacy code
const mockSupabaseClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Use backend API for authentication' } }),
    signUp: () => Promise.resolve({ data: null, error: { message: 'Use backend API for authentication' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Use backend API for data access' } })
      })
    })
  })
};

const supabase = mockSupabaseClient;
const supabaseAdmin = mockSupabaseClient;

export default supabase;
export { supabase, supabaseAdmin };
