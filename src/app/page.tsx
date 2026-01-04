"use client";

import { HeroParallax } from "@/components/ui/hero-parallax";
import { MockifyNavbar } from "@/components/mockify-navbar";
import { MockifyFeaturesBento } from "@/components/mockify-features-bento";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import HowItWorksSection from "@/components/how-it-works-section";
import { useEffect } from "react";
import { 
  Brain, 
  Upload, 
  Zap, 
  BarChart3, 
  CheckCircle, 
  Users, 
  Clock,
  Target,
  Sparkles,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Question Generation",
    description: "Advanced LLMs analyze your study materials and generate personalized mock test questions tailored to your exam needs."
  },
  {
    icon: Upload,
    title: "Smart Material Processing", 
    description: "Upload PDFs, images, or text files. Our OCR technology extracts content and prepares it for intelligent question generation."
  },
  {
    icon: Zap,
    title: "Instant Test Creation",
    description: "Generate comprehensive mock tests in seconds. Choose difficulty levels, topics, and question formats that match your preparation goals."
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Detailed analytics reveal your strengths and weaknesses. Track progress over time and identify areas needing focused attention."
  },
  {
    icon: Target,
    title: "Adaptive Learning",
    description: "AI adapts to your performance, generating more questions on weak topics and adjusting difficulty based on your improvement."
  },
  {
    icon: Clock,
    title: "Timed Practice Sessions",
    description: "Simulate real exam conditions with timed tests. Build speed and accuracy while managing time pressure effectively."
  }
];

const stats = [
  { number: "50K+", label: "Questions Generated" },
  { number: "10K+", label: "Active Users" },
  { number: "95%", label: "Success Rate" },
  { number: "24/7", label: "AI Support" }
];

const heroProducts = [
  {
    title: "AI Question Generation",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
  },
  {
    title: "Smart Material Upload",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
  },
  {
    title: "Performance Analytics",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
  },
  {
    title: "Timed Practice Tests",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
  },
  {
    title: "Adaptive Learning",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=600&fit=crop",
  },
  {
    title: "Study Materials Library",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop",
  },
  {
    title: "Progress Tracking",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  },
  {
    title: "Real Exam Simulation",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&h=600&fit=crop",
  },
  {
    title: "Detailed Feedback",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
  },
  {
    title: "Multi-Format Support",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop",
  },
  {
    title: "Instant Results",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop",
  },
  {
    title: "Custom Test Creation",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
  },
  {
    title: "AI-Powered Insights",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop",
  },
  {
    title: "Collaborative Learning",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
  },
  {
    title: "Success Stories",
    link: "/dashboard",
    thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop",
  },
];

const testimonials = [
  {
    quote: "MockifyAI transformed my preparation! The AI-generated questions were exactly like the real exam. Cleared UPSC in my first attempt!",
    name: "Priya Sharma",
    title: "UPSC Aspirant"
  },
  {
    quote: "The personalized analytics helped me identify weak areas. Improved my score by 40% in just 2 months of practice.",
    name: "Rahul Kumar", 
    title: "Banking Exam Candidate"
  },
  {
    quote: "Upload my textbook PDFs and get instant practice questions. It's like having a personal tutor available 24/7!",
    name: "Anjali Patel",
    title: "Medical Student"
  },
  {
    quote: "The adaptive learning feature is a game-changer. It focuses on my weak areas automatically. Highly recommend!",
    name: "Vikram Singh",
    title: "SSC CGL Aspirant"
  },
  {
    quote: "Best tool for exam preparation. The timed tests helped me manage time pressure during actual exams.",
    name: "Sneha Reddy",
    title: "NEET Aspirant"
  },
  {
    quote: "MockifyAI's AI understands my study materials better than I do! Questions are challenging yet relevant.",
    name: "Arjun Mehta",
    title: "CA Foundation Student"
  },
  {
    quote: "The instant feedback feature helped me understand my mistakes immediately. My accuracy improved from 65% to 88%!",
    name: "Kavya Desai",
    title: "JEE Aspirant"
  },
  {
    quote: "I love how the AI adapts to my learning pace. The personalized question difficulty made studying so much more effective.",
    name: "Rohan Gupta",
    title: "CAT Preparation"
  },
  {
    quote: "Being able to practice with questions generated from my own notes is incredible. Cleared my semester exams with 92%!",
    name: "Ishita Verma",
    title: "Engineering Student"
  },
  {
    quote: "The detailed performance analytics showed me exactly where I was going wrong. Finally cracked the GATE exam!",
    name: "Amit Patel",
    title: "GATE Candidate"
  },
  {
    quote: "MockifyAI made my IELTS preparation so structured. The timed tests were exactly like the real exam environment.",
    name: "Sarah Johnson",
    title: "IELTS Aspirant"
  },
  {
    quote: "As a working professional, the flexibility to practice anytime was a game-changer. Cleared my certification exam on the first try!",
    name: "Deepak Singh",
    title: "IT Professional"
  }
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F6F2]">
      {/* Dotted Background Pattern */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
      </div>
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 origin-left z-50"
        style={{ scaleX }}
      />
      
      <div className="relative z-10">
        <MockifyNavbar />
        
        {/* Hero Section with Parallax */}
        <div className="pt-20">
          <HeroParallax products={heroProducts} />
        </div>

        {/* Features Section */}
        <section id="features">
          <MockifyFeaturesBento />
        </section>

        {/* How it Works */}
        <HowItWorksSection />

        {/* Testimonials */}
        <section id="testimonials" className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-16"
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 bg-gradient-to-r from-violet-400 to-purple-500 border-2 border-black text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-xs sm:text-sm px-3 py-1">
              Testimonials
            </Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black mb-3 sm:mb-4">
              Loved by exam aspirants
            </h2>
            <p className="text-base sm:text-xl text-black max-w-2xl mx-auto font-medium px-4">
              Join thousands of successful candidates who transformed their exam preparation with MockifyAI
            </p>
          </motion.div>
          
          <InfiniteMovingCards
            items={testimonials}
            direction="left"
            speed="normal"
            pauseOnHover={true}
            className="py-6 sm:py-10"
          />
        </div>
      </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-32">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="rounded-xl sm:rounded-2xl bg-white border-2 sm:border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-12"
            >
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-black mb-4 sm:mb-6">
                Ready to ace your exams?
              </h2>
              <p className="text-base sm:text-xl text-black mb-6 sm:mb-8 max-w-2xl mx-auto font-medium">
                Join thousands of successful candidates who used MockifyAI to achieve their goals. 
                Start your free trial today.
              </p>
              <Button size="lg" asChild className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white font-bold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                <Link href="/signup">
                  Start Your Success Story
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
