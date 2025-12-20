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
      "fixed inset-0 z-100 flex items-center justify-center bg-white/98 dark:bg-[#030213]/98 backdrop-blur-sm",
      className
    )}>
      <motion.div 
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Loader />
        <motion.p 
          className="text-gray-600 dark:text-gray-400 text-sm font-medium"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
