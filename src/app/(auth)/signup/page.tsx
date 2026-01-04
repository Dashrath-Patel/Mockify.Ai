"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { IconBrandGoogle, IconBrandFacebook, IconBrandApple } from "@tabler/icons-react";
import { Eye, EyeOff, Home, Layers, MessageSquare, LogIn, UserPlus } from "lucide-react";
import { navigationEvents } from "@/lib/navigation-events";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import { DotBackground } from "@/components/ui/dot-background";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for OAuth errors
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });

      console.log('Signup response:', { 
        user: data.user?.id, 
        session: !!data.session,
        error: error?.message 
      });

      if (error) {
        console.error('Signup error:', error);
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        console.error('No user returned from signup');
        toast.error('Signup failed. Please try again.');
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('Email confirmation required for:', email);
        toast.info('Please check your email to confirm your account.', {
          description: 'A confirmation link has been sent to your email address.',
          duration: 8000,
        });
        return;
      }

      if (data.user && data.session) {
        console.log('User signed up successfully with session:', data.user.id);
        
        // Give Supabase a moment to commit the auth user to the database
        console.log('Waiting 2 seconds for auth user to be committed...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create user profile via API route (uses service role to bypass RLS)
        // Wait for profile creation before redirecting to ensure complete setup
        try {
          console.log('Creating user profile for:', data.user.email);
          
          const response = await fetch('/api/create-user-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email!,
              name: `${firstName} ${lastName}`.trim(),
            }),
          });

          console.log('API Response status:', response.status, response.statusText);

          let result;
          try {
            result = await response.json();
          } catch (parseError) {
            console.error('Failed to parse API response:', parseError);
            console.error('Response text:', await response.text());
            toast.error('Server error. Please try again.');
            return;
          }

          console.log('API Response body:', result);

          // Handle email confirmation case
          if (response.status === 202 && result.requiresEmailConfirmation) {
            console.log('Email confirmation required');
            toast.success('Account created! Please check your email.', {
              description: 'Click the confirmation link in your email to complete signup. Your profile will be created automatically after confirmation.',
              duration: 10000,
            });
            return;
          }

          if (!response.ok || !result.success) {
            console.error('Error creating user profile:', result);
            console.error('Full error details:', JSON.stringify(result, null, 2));
            
            toast.error('Failed to create profile. Please contact support.', {
              description: result.error || 'Your account was created but profile setup failed.'
            });
            return;
          }

          console.log('User profile created successfully:', result.message);
          toast.success("Account created successfully!");
          navigationEvents.start("/onboarding");
          router.push("/onboarding");
        } catch (error) {
          console.error('Failed to call create-user-profile API:', error);
          console.error('Error type:', error instanceof Error ? error.message : typeof error);
          toast.error('Failed to create profile. Please try again.');
          return;
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      }
      // Don't set isLoading to false here - let the redirect happen
    } catch (error) {
      toast.error("Failed to sign up with Google");
      setIsLoading(false);
    }
  };

  return (
    <DotBackground className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-12 pb-20 md:pb-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-5 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-1.5 sm:mb-2">
              Create an account
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <Link href="/login" className="text-black dark:text-white font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  First name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Last name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 sm:h-12 text-sm sm:text-base border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 sm:h-12 pr-10 text-sm sm:text-base border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-1.5 sm:space-x-2 pt-1 sm:pt-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5"
              />
              <label
                htmlFor="terms"
                className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer leading-relaxed"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-black dark:text-white hover:underline">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-black dark:text-white hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-12 bg-neutral-800 hover:bg-black dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-black font-medium text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create an account"}
            </Button>
          </form>

          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-white dark:bg-black text-neutral-500 dark:text-neutral-400">
                OR
              </span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 sm:h-12 flex items-center justify-center space-x-2 sm:space-x-3 border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-sm sm:text-base"
              onClick={handleGoogleSignUp}
            >
              <IconBrandGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Continue with Google</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-black shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Home */}
          <Link href="/" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          
          {/* Features */}
          <Link href="/#features" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
            <Layers className="h-5 w-5" />
            <span className="text-[10px] font-medium">Features</span>
          </Link>
          
          {/* Sign Up - Center Button - Active */}
          <Link href="/signup" className="flex flex-col items-center -mt-4">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <UserPlus className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-[10px] font-bold text-black mt-1">Sign Up</span>
          </Link>
          
          {/* Reviews */}
          <Link href="/#testimonials" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-medium">Reviews</span>
          </Link>
          
          {/* Login */}
          <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
            <LogIn className="h-5 w-5" />
            <span className="text-[10px] font-medium">Login</span>
          </Link>
        </div>
      </div>
    </DotBackground>
  );
}
