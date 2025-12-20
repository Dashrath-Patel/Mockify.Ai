import { createClient } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// Get current authenticated user consistently across the app
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('No authenticated user found');
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Ensure user exists in public.users table (required for foreign key constraints)
export async function ensureUserRecord(authUser: AuthUser): Promise<boolean> {
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Check if user exists in public.users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          exam_type: null,
          language: 'English',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return false;
      }

      console.log('User record created successfully');
      return true;
    } else if (fetchError) {
      console.error('Error checking user existence:', fetchError);
      return false;
    }

    // User already exists
    return true;
  } catch (error) {
    console.error('Error ensuring user record:', error);
    return false;
  }
}

// Check if user is authenticated, redirect to login if not
export async function requireAuth(): Promise<AuthUser | never> {
  if (typeof window === 'undefined') {
    // Server-side - can't redirect, return null
    throw new Error('Authentication required');
  }

  const user = await getCurrentUser();
  
  if (!user) {
    // Redirect to login
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  return user;
}