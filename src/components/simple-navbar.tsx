"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, Menu, X, ChevronDown } from "lucide-react";

export function SimpleNavbar({ className }: { className?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={cn("bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 sticky top-0 z-50", className)}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MockifyAI</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Features
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                Exams
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div className="group relative rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                      <div className="font-semibold text-gray-900">
                        <Link href="/exams/upsc" className="stretched-link">
                          UPSC
                        </Link>
                      </div>
                      <p className="mt-1 text-gray-600">Civil services examination</p>
                    </div>
                    <div className="group relative rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                      <div className="font-semibold text-gray-900">
                        <Link href="/exams/banking" className="stretched-link">
                          Banking
                        </Link>
                      </div>
                      <p className="mt-1 text-gray-600">Banking sector exams</p>
                    </div>
                    <div className="group relative rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                      <div className="font-semibold text-gray-900">
                        <Link href="/exams/jee" className="stretched-link">
                          JEE
                        </Link>
                      </div>
                      <p className="mt-1 text-gray-600">Engineering entrance</p>
                    </div>
                    <div className="group relative rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                      <div className="font-semibold text-gray-900">
                        <Link href="/exams/neet" className="stretched-link">
                          NEET
                        </Link>
                      </div>
                      <p className="mt-1 text-gray-600">Medical entrance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="#pricing"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Pricing
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                Resources
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute -left-8 top-full z-10 mt-3 w-56 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-4">
                  <div className="group relative rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                    <div className="font-semibold text-gray-900">
                      <Link href="/blog" className="stretched-link">
                        Blog
                      </Link>
                    </div>
                    <p className="mt-1 text-gray-600">Latest insights and tips</p>
                  </div>
                  <div className="group relative rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                    <div className="font-semibold text-gray-900">
                      <Link href="/help" className="stretched-link">
                        Help Center
                      </Link>
                    </div>
                    <p className="mt-1 text-gray-600">Get support and answers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-x-4">
            <div className="hidden lg:flex lg:items-center lg:gap-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white font-bold">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-2 px-4 pb-3 pt-2">
              <Link
                href="#features"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <div className="space-y-1">
                <div className="px-3 py-2 text-base font-medium text-gray-900">Exams</div>
                <Link
                  href="/exams/upsc"
                  className="block rounded-md px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  UPSC
                </Link>
                <Link
                  href="/exams/banking"
                  className="block rounded-md px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Banking
                </Link>
                <Link
                  href="/exams/jee"
                  className="block rounded-md px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  JEE
                </Link>
                <Link
                  href="/exams/neet"
                  className="block rounded-md px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  NEET
                </Link>
              </div>
              <Link
                href="#pricing"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <div className="space-y-1">
                <div className="px-3 py-2 text-base font-medium text-gray-900">Resources</div>
                <Link
                  href="/blog"
                  className="block rounded-md px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/help"
                  className="block rounded-md px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Help Center
                </Link>
              </div>
              <div className="mt-6 space-y-2">
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white font-bold">
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}