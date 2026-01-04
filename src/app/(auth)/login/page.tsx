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
import { Eye, EyeOff, Home, Layers, MessageSquare, LogIn, UserPlus, Sparkles } from "lucide-react";
import { navigationEvents } from "@/lib/navigation-events";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
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
      {/* Top Navbar */}
      <div className="fixed top-2 inset-x-0 max-w-6xl mx-auto z-50 px-4">
        <div className="flex items-center justify-center md:justify-start bg-white/90 backdrop-blur-md rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-4 py-2.5">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-black">
              MockifyAI
            </span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 py-6 sm:py-12 pb-20 md:pb-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-5 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-1.5 sm:mb-2">
              Log in
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Don't have an account?{" "}
              <Link href="/signup" className="text-black dark:text-white font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 sm:h-12 flex items-center justify-center space-x-2 sm:space-x-3 border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-sm sm:text-base"
              onClick={handleGoogleLogin}
            >
              <IconBrandGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Continue with Google</span>
            </Button>
          </div>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-white dark:bg-black text-neutral-500 dark:text-neutral-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email address or user name
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
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="h-4 w-4 sm:h-5 sm:w-5"
                />
                <label
                  htmlFor="remember"
                  className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline"
              >
                Forget your password
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-12 bg-neutral-800 hover:bg-black dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-black font-medium text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Log in"}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>

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
          
          {/* Sign Up - Center Button */}
          <Link href="/signup" className="flex flex-col items-center -mt-4">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
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
          
          {/* Login - Active */}
          <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-black">
            <LogIn className="h-5 w-5" />
            <span className="text-[10px] font-bold">Login</span>
          </Link>
        </div>
      </div>
    </DotBackground>
  );
}
