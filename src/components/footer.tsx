import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t-[3px] border-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-black mb-4">
              MockifyAI
            </h3>
            <p className="text-black mb-4 max-w-md font-medium">
              Transform your study materials into personalized mock tests using AI. 
              Get instant feedback and improve your exam performance.
            </p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-emerald-400 hover:to-teal-500 hover:text-white transition-all border-2 border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-violet-400 hover:to-purple-500 hover:text-white transition-all border-2 border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-amber-400 hover:to-orange-500 hover:text-white transition-all border-2 border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-black hover:bg-gradient-to-r hover:from-rose-400 hover:to-pink-500 hover:text-white transition-all border-2 border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-black mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Demo
                </Link>
              </li>
              <li>
                <Link
                  href="/integrations"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-black mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-black hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-black mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-black text-sm font-medium">
            © {new Date().getFullYear()} MockifyAI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-black hover:text-[#8B5CF6] text-sm transition-colors font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-black hover:text-[#8B5CF6] text-sm transition-colors font-medium"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-black hover:text-[#8B5CF6] text-sm transition-colors font-medium"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}