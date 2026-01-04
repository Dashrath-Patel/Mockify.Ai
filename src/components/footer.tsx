import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t-2 sm:border-t-[3px] border-black pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        {/* Mobile: Compact 2-column layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2">
            <h3 className="text-lg sm:text-2xl font-bold text-black mb-2 sm:mb-4">
              MockifyAI
            </h3>
            <p className="text-xs sm:text-base text-black mb-3 sm:mb-4 max-w-md font-medium line-clamp-2 sm:line-clamp-none">
              Transform your study materials into personalized mock tests using AI.
            </p>
            <div className="flex space-x-2 sm:space-x-4">
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-emerald-400 hover:to-teal-500 hover:text-white transition-all border-2 border-black rounded-lg p-1 sm:p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Twitter className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Link>
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-violet-400 hover:to-purple-500 hover:text-white transition-all border-2 border-black rounded-lg p-1 sm:p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Github className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Link>
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-amber-400 hover:to-orange-500 hover:text-white transition-all border-2 border-black rounded-lg p-1 sm:p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Linkedin className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Link>
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-rose-400 hover:to-pink-500 hover:text-white transition-all border-2 border-black rounded-lg p-1 sm:p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Mail className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-black mb-2 sm:mb-4 text-xs sm:text-base">
              Product
            </h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium text-[10px] sm:text-sm"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium text-[10px] sm:text-sm"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium text-[10px] sm:text-sm"
                >
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-black mb-2 sm:mb-4 text-xs sm:text-base">
              Support
            </h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium text-[10px] sm:text-sm"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium text-[10px] sm:text-sm"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium text-[10px] sm:text-sm"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Compact on mobile */}
        <div className="border-t-2 border-black mt-4 sm:mt-12 pt-4 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <p className="text-black text-[10px] sm:text-sm font-medium text-center">
            © {new Date().getFullYear()} MockifyAI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:space-x-6">
            <Link
              href="/privacy"
              className="text-black hover:text-[#8B5CF6] text-[10px] sm:text-sm transition-colors font-medium"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-black hover:text-[#8B5CF6] text-[10px] sm:text-sm transition-colors font-medium"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-black hover:text-[#8B5CF6] text-[10px] sm:text-sm transition-colors font-medium"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}