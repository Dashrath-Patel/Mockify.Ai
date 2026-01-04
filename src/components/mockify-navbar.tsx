"use client";

import { Menu, MenuItem } from "@/components/ui/navbar-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { Sparkles, Home, Layers, MessageSquare, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function MockifyNavbar() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
    {/* Desktop Navigation */}
    <div className="fixed top-2 inset-x-0 max-w-6xl mx-auto z-50 px-4">
      <div className="relative">
        <div className="hidden md:block">
          <Menu setActive={setActive}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 mr-6">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-black">
                MockifyAI
              </span>
            </Link>

            {/* Navigation Items */}
            <a href="#features" className="text-sm text-black font-medium hover:bg-white hover:border-2 hover:border-black hover:rounded-lg hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all px-3 py-1.5">
              Features
            </a>

            <a href="#how-it-works" className="text-sm text-black font-medium hover:bg-white hover:border-2 hover:border-black hover:rounded-lg hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all px-3 py-1.5">
              How it Works
            </a>

            <a href="#testimonials" className="text-sm text-black font-medium hover:bg-white hover:border-2 hover:border-black hover:rounded-lg hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all px-3 py-1.5">
              Testimonials
            </a>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 ml-auto">
              <Button 
                variant="outline" 
                asChild 
                size="sm"
                className="h-9 text-sm bg-white hover:bg-gray-50 text-black border-2 border-black rounded-xl font-bold px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button 
                asChild
                size="sm"
                className="h-9 text-sm bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-2 border-black rounded-xl font-bold px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </Menu>
        </div>

        {/* Mobile Top Bar - Just Logo */}
        <div className="md:hidden">
          <div className="flex items-center justify-center bg-white/90 backdrop-blur-md rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-4 py-2.5">
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
      </div>
    </div>

    {/* Mobile Bottom Navigation Bar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-black shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around py-2 px-2">
        {/* Home */}
        <a href="#" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-black">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </a>
        
        {/* Features */}
        <a href="#features" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
          <Layers className="h-5 w-5" />
          <span className="text-[10px] font-medium">Features</span>
        </a>
        
        {/* Get Started - Center Button */}
        <Link href="/signup" className="flex flex-col items-center -mt-4">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <UserPlus className="h-6 w-6 text-white" />
          </motion.div>
          <span className="text-[10px] font-bold text-black mt-1">Sign Up</span>
        </Link>
        
        {/* Testimonials */}
        <a href="#testimonials" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] font-medium">Reviews</span>
        </a>
        
        {/* Login */}
        <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500">
          <LogIn className="h-5 w-5" />
          <span className="text-[10px] font-medium">Login</span>
        </Link>
      </div>
    </div>
    </>
  );
}
