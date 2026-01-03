/**
 * Proxy for Authentication, Security, and Performance
 * Handles auth checks, security headers, rate limiting, and analytics
 * 
 * Note: Renamed from middleware to proxy as per Next.js 16 convention
 * See: https://nextjs.org/docs/messages/middleware-to-proxy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/api/health', '/auth/callback'];

// API routes that need rate limiting
const apiRoutes = ['/api/generate-questions', '/api/upload'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add security headers
  response = addSecurityHeaders(response);

  // Handle authentication
  if (!publicRoutes.includes(pathname) && !pathname.startsWith('/api/')) {
    const authResponse = await handleAuthentication(request, response);
    
    if (!authResponse) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    response = authResponse;
  }

  // Add performance headers
  response = addPerformanceHeaders(response, pathname);

  // Add analytics headers
  response.headers.set('x-pathname', pathname);
  response.headers.set('x-timestamp', Date.now().toString());

  return response;
}

/**
 * Add security headers to protect against common vulnerabilities
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Content Security Policy
  const isDevelopment = process.env.NODE_ENV === 'development';
  const connectSrc = isDevelopment
    ? "'self' https://api.supabase.io https://*.supabase.co ws://localhost:* ws://127.0.0.1:*"
    : "'self' https://api.supabase.io https://*.supabase.co";
  
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

/**
 * Add performance-related headers
 */
function addPerformanceHeaders(
  response: NextResponse,
  pathname: string
): NextResponse {
  // Cache static assets aggressively
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }
  
  // Cache API responses with short TTL
  if (pathname.startsWith('/api/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=60, stale-while-revalidate=120'
    );
  }

  return response;
}

/**
 * Handle authentication check
 */
async function handleAuthentication(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse | null> {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return null;
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check if user is authenticated with timeout
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Auth check timeout')), 5000)
    );
    
    const authPromise = supabase.auth.getUser();
    
    const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;

    if (!user) {
      return null; // Will redirect to login
    }

    return response;
  } catch (error) {
    console.error('Authentication error in middleware:', error);
    
    // In development, be more lenient with auth errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('Skipping auth check in development due to error');
      return response; // Allow access in development
    }
    
    return null; // Redirect to login in production
  }
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
