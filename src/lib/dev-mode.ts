/**
 * Development Mode Configuration
 * Allows testing core functionality without Supabase
 */

export const DEV_MODE = {
  // Enable development mode (bypasses Supabase)
  enabled: true,
  
  // Mock user for development
  mockUser: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Dev User',
    email: 'dev@mockifyai.com',
    exam_type: 'General',
    language: 'English'
  },
  
  // Mock authentication
  mockAuth: {
    isAuthenticated: true,
    token: 'dev-token-123'
  }
};

/**
 * Check if we should use development mode
 */
export function isDevMode(): boolean {
  return DEV_MODE.enabled || process.env.NODE_ENV === 'development';
}

/**
 * Get mock user for development
 */
export function getDevUser() {
  return DEV_MODE.mockUser;
}

/**
 * Mock Supabase client for development
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ 
        data: { user: DEV_MODE.mockUser }, 
        error: null 
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: DEV_MODE.mockUser }, 
        error: null 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: DEV_MODE.mockUser }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ 
            data: DEV_MODE.mockUser, 
            error: null 
          })
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ 
            data: { id: Math.random().toString(36), ...data }, 
            error: null 
          })
        })
      }),
      update: (data: any) => ({
        eq: () => Promise.resolve({ 
          data: { ...data }, 
          error: null 
        })
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ 
          data: { path: 'mock-file-path' }, 
          error: null 
        }),
        getPublicUrl: () => ({ 
          data: { publicUrl: 'https://mock-url.com/file' } 
        })
      })
    }
  };
}

/**
 * Log development mode status
 */
export function logDevModeStatus() {
  if (isDevMode()) {
    console.log('🔧 Development Mode: ENABLED');
    console.log('📝 Mock User:', DEV_MODE.mockUser.email);
    console.log('⚠️ Supabase calls will be mocked');
    console.log('💡 To disable: Set DEV_MODE.enabled = false in src/lib/dev-mode.ts');
  } else {
    console.log('🚀 Production Mode: Using real Supabase');
  }
}