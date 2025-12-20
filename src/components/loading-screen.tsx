"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Loader from "@/components/ui/aceternity/loader";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export default function LoadingScreen({ 
  message = "Loading...",
  className 
}: LoadingScreenProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-100 flex items-center justify-center bg-[#F9F6F2]/98 backdrop-blur-md",
      className
    )}>
      <motion.div 
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <div className="flex items-center justify-center w-32 h-32">
          <Loader />
        </div>
        <motion.p 
          className="text-black text-base font-medium"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.05 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
