"use client";

import { useState, useEffect } from 'react';
import { 
  Sidebar, 
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider 
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { OptimizedLink } from '@/components/OptimizedLink';
import { usePrefetchRoutes, prefetchSmartRoutes, ROUTE_PREFETCH_MAP } from '@/lib/route-prefetch';
import { PageTransition } from '@/components/PageTransition';
import { navigationEvents } from '@/lib/navigation-events';
import {
  Home,
  Brain,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Upload,
  Award,
  UserCircle,
  History,
  Zap
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export function AppLayout({ children, hideSidebar = false }: AppLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Prefetch routes based on current page
  const routesToPrefetch = ROUTE_PREFETCH_MAP[pathname] || [];
  usePrefetchRoutes(routesToPrefetch);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Intelligent route prefetching
    prefetchSmartRoutes(pathname, router);
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigationEvents.start('/');
    router.push('/');
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Upload Materials",
      href: "/upload",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      label: "Generate Test",
      href: "/dashboard/tests",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      label: "Test History",
      href: "/dashboard/test-history",
      icon: <History className="h-5 w-5" />,
    },
    {
      label: "Progress & Analytics",
      href: "/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Community",
      href: "/community",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <UserCircle className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F2] transition-colors duration-300">
      {/* Main Layout */}
      <SidebarProvider defaultOpen>
        <div className="flex w-full h-screen relative z-10">
          {!hideSidebar && (
          <Sidebar className="border-r-2 border-black bg-[#F9F6F2]">
            <SidebarHeader className="border-b-2 border-black bg-[#F9F6F2]">
              {/* Logo */}
              <div className="flex items-center space-x-3 py-6 px-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold text-2xl text-gray-900 whitespace-pre"
                >
                  MockifyAI
                </motion.span>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="px-3 py-4">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {/* Navigation Links */}
                    {links.map((link, idx) => {
                      const isActive = pathname === link.href;
                      return (
                        <SidebarMenuItem key={idx}>
                          <SidebarMenuButton asChild>
                            <OptimizedLink
                              href={link.href}
                              prefetch={true}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                                isActive 
                                  ? "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                  : "text-black hover:bg-white hover:border-2 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              )}
                            >
                              {link.icon}
                              <span>{link.label}</span>
                            </OptimizedLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            
            <SidebarFooter className="border-t-2 border-black mt-auto bg-[#F9F6F2]">
              {/* User Info & Actions */}
              <div className="p-4 space-y-2">
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-white rounded-xl border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>
          )}
        
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-[#F9F6F2]">
            <PageTransition className="min-h-[calc(100vh-80px)]">
              {children}
            </PageTransition>
            
            {/* Footer */}
            <footer className="py-6 text-center text-sm border-t border-gray-200">
              <p className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent font-medium">
                © 2025 MockifyAI. All rights reserved.
              </p>
            </footer>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
