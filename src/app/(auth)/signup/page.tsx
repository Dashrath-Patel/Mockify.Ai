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
import { Eye, EyeOff } from "lucide-react";
import { navigationEvents } from "@/lib/navigation-events";
import { Footer } from "@/components/footer";
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
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Create an account
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <Link href="/login" className="text-black dark:text-white font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  First name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-12 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Last name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-12 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  className="h-12 pr-10 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms"
                className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer leading-relaxed"
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
              className="w-full h-12 bg-neutral-800 hover:bg-black dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-black font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create an account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-black text-neutral-500 dark:text-neutral-400">
                OR
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 flex items-center justify-center space-x-3 border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              onClick={handleGoogleSignUp}
            >
              <IconBrandGoogle className="w-5 h-5" />
              <span>Continue with Google</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </DotBackground>
  );
}
