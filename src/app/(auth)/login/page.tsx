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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("Login failed. Please try again.");
        return;
      }

      // Check if user profile exists in database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, name, onboarding_completed')
        .eq('id', data.user.id)
        .single();

      // If user doesn't exist in database, show error and sign them out
      if (profileError || !profile) {
        await supabase.auth.signOut();
        
        if (profileError?.code === 'PGRST116') {
          // User not found in database
          toast.error("Profile not found", {
            description: "Your account exists but profile was not created. Please sign up again to create your profile.",
            duration: 6000,
          });
        } else {
          console.error('Profile error:', profileError);
          toast.error('Failed to load profile. Please try again.');
        }
        return;
      }

      // User exists - check onboarding status
      const onboardingCompleted = profile.onboarding_completed ?? false;
      
      if (!onboardingCompleted) {
        // User needs to complete onboarding
        toast.info(`Welcome ${profile.name}! Please complete your profile setup.`);
        navigationEvents.start("/onboarding");
        router.push("/onboarding");
        return;
      }

      // User fully set up - go to dashboard
      toast.success(`Welcome back, ${profile.name}!`);
      navigationEvents.start("/dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
      toast.error("Failed to login with Google");
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
              Log in
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Don't have an account?{" "}
              <Link href="/signup" className="text-black dark:text-white font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 flex items-center justify-center space-x-3 border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              onClick={handleGoogleLogin}
            >
              <IconBrandGoogle className="w-5 h-5" />
              <span>Continue with Google</span>
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-black text-neutral-500 dark:text-neutral-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email address or user name
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
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline"
              >
                Forget your password
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-neutral-800 hover:bg-black dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-black font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Log in"}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </DotBackground>
  );
}
