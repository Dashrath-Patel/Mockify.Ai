import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint uses service role to bypass RLS and create user profiles
// Only called immediately after successful auth signup
export async function POST(request: NextRequest) {
  try {
    console.log('[create-user-profile] API called');
    
    const { userId, email, name } = await request.json()
    console.log('[create-user-profile] Request data:', { userId, email, name });

    if (!userId || !email || !name) {
      console.error('[create-user-profile] Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, email, name' },
        { status: 400 }
      )
    }

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[create-user-profile] SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Service role key not found' },
        { status: 500 }
      )
    }

    // Create a Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('[create-user-profile] Supabase admin client created');

    // Check if the auth user actually exists
    // This handles the case where email confirmation is enabled
    console.log('[create-user-profile] Checking if auth user exists...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (authError || !authUser?.user) {
      console.error('[create-user-profile] Auth user not found:', authError?.message);
      console.log('[create-user-profile] This usually means email confirmation is required');
      return NextResponse.json(
        { 
          success: false, 
          error: 'User pending email confirmation',
          requiresEmailConfirmation: true
        },
        { status: 202 } // 202 Accepted - processing will complete later
      )
    }

    console.log('[create-user-profile] Auth user verified:', email);

    // Check if user profile already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[create-user-profile] Error checking existing user:', checkError);
    }

    if (existingUser) {
      console.log('[create-user-profile] User profile already exists:', email)
      return NextResponse.json({ 
        success: true, 
        message: 'User profile already exists' 
      })
    }

    console.log('[create-user-profile] Creating new user profile...');

    // Create user profile with service role (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        name: name,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[create-user-profile] Error creating user profile:', insertError)
      console.error('[create-user-profile] Error code:', insertError.code);
      console.error('[create-user-profile] Error message:', insertError.message);
      console.error('[create-user-profile] Error details:', insertError.details);
      console.error('[create-user-profile] Error hint:', insertError.hint);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create user profile', 
          details: {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          }
        },
        { status: 500 }
      )
    }

    console.log('[create-user-profile] User profile created successfully:', email)
    return NextResponse.json({ 
      success: true, 
      message: 'User profile created successfully' 
    })

  } catch (error) {
    console.error('[create-user-profile] Unexpected error:', error)
    console.error('[create-user-profile] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
