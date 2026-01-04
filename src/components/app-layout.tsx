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
  Zap,
  FileCheck2
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
      label: "Test Warehouse",
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

  // Mobile bottom nav items (subset of main links for quick access)
  const mobileNavItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Upload",
      href: "/upload",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      label: "Generate",
      href: "/dashboard/tests",
      icon: <Zap className="h-6 w-6" />,
      isCenter: true,
    },
    {
      label: "History",
      href: "/dashboard/test-history",
      icon: <History className="h-5 w-5" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <UserCircle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F2] transition-colors duration-300">
      {/* Main Layout */}
      <SidebarProvider defaultOpen>
        <div className="flex w-full h-screen relative z-10">
          {!hideSidebar && (
          <Sidebar className="border-r-2 border-black bg-[#F9F6F2] hidden md:flex">
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
          <main className="flex-1 overflow-auto bg-[#F9F6F2] pb-20 md:pb-0">
            <PageTransition className="min-h-[calc(100vh-80px)]">
              {children}
            </PageTransition>
            
            {/* Footer - hidden on mobile */}
            <footer className="hidden md:block py-6 text-center text-sm border-t border-gray-200">
              <p className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent font-medium">
                © 2025 MockifyAI. All rights reserved.
              </p>
            </footer>
          </main>

          {/* Mobile Bottom Navigation */}
          {!hideSidebar && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1a1a1a] border-t-2 border-black dark:border-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-around h-16 px-2 relative">
                {mobileNavItems.map((item, idx) => {
                  const isActive = pathname === item.href;
                  
                  if (item.isCenter) {
                    // Center floating button for Generate Test
                    return (
                      <OptimizedLink
                        key={idx}
                        href={item.href}
                        prefetch={true}
                        className="absolute -top-6 left-1/2 -translate-x-1/2"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-2 border-black dark:border-white",
                            isActive
                              ? "bg-gradient-to-br from-purple-600 to-blue-600"
                              : "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
                          )}
                        >
                          <FileCheck2 className="h-6 w-6 text-white" />
                        </motion.div>
                      </OptimizedLink>
                    );
                  }
                  
                  return (
                    <OptimizedLink
                      key={idx}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]",
                        isActive
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-xl transition-all",
                        isActive && "bg-purple-100 dark:bg-purple-900/30"
                      )}>
                        {item.icon}
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium mt-0.5",
                        isActive && "font-bold"
                      )}>
                        {item.label}
                      </span>
                    </OptimizedLink>
                  );
                })}
              </div>
              {/* Safe area for devices with home indicator */}
              <div className="h-safe-area-inset-bottom bg-white dark:bg-[#1a1a1a]" />
            </nav>
          )}
        </div>
      </SidebarProvider>
    </div>
  );
}
