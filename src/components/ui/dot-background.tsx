import { cn } from "@/lib/utils";
import React from "react";

interface DotBackgroundProps {
  children: React.ReactNode;
  className?: string;
  dotColor?: string;
  dotColorDark?: string;
}

export function DotBackground({
  children,
  className,
  dotColor = "#d4d4d4",
  dotColorDark = "#404040",
}: DotBackgroundProps) {
  return (
    <div className={cn("relative w-full bg-white dark:bg-black", className)}>
      {/* Dot background pattern */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          "[background-size:20px_20px]",
        )}
        style={{
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        }}
      />
      <div
        className={cn(
          "absolute inset-0 z-0 dark:block hidden",
          "[background-size:20px_20px]",
        )}
        style={{
          backgroundImage: `radial-gradient(${dotColorDark} 1px, transparent 1px)`,
        }}
      />
      
      {/* Radial gradient overlay for faded effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
