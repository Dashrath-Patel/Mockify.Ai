"use client";

import { Menu, MenuItem } from "@/components/ui/navbar-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MockifyNavbar() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="fixed top-2 inset-x-0 max-w-6xl mx-auto z-50 px-4">
      <div className="relative">
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
    </div>
  );
}
