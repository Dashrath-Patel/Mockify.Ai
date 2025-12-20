import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (data.user) {
      // Check if user profile exists in database
      const { data: existingProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, onboarding_completed')
        .eq('id', data.user.id)
        .single()

      let shouldRedirectToOnboarding = false;

      if (existingProfile) {
        // Existing user - check onboarding status
        console.log('Existing user logged in:', existingProfile.email)
        const onboardingCompleted = existingProfile.onboarding_completed ?? true;
        shouldRedirectToOnboarding = !onboardingCompleted;
      } else if (profileError?.code === 'PGRST116') {
        // New user - profile doesn't exist, create it
        console.log('New OAuth user, creating profile...')
        const userName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name || 
                        data.user.email!.split('@')[0]

        try {
          // Create user profile synchronously to ensure it exists before redirect
          const response = await fetch(`${requestUrl.origin}/api/create-user-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email!,
              name: userName,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            console.error('Error creating user profile:', result);
            // Redirect to signup with error
            return NextResponse.redirect(
              `${requestUrl.origin}/signup?error=${encodeURIComponent('Failed to create profile. Please try again.')}`
            )
          }

          console.log('User profile created:', result.message);
          shouldRedirectToOnboarding = true;
        } catch (error) {
          console.error('Failed to create profile:', error);
          return NextResponse.redirect(
            `${requestUrl.origin}/signup?error=${encodeURIComponent('Failed to create profile. Please try again.')}`
          )
        }
      } else {
        // Unexpected error
        console.error('Profile check error:', profileError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent('Failed to load profile. Please try again.')}`
        )
      }

      // Redirect to onboarding if needed, otherwise to the requested destination
      const redirectPath = shouldRedirectToOnboarding ? '/onboarding' : next;
      return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
}
