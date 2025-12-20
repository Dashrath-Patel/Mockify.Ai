import React from "react";
import { motion } from "motion/react";
import { cn } from "./utils";

export const SparklesCore = ({
  id,
  background,
  minSize,
  maxSize,
  particleDensity,
  className,
  particleColor,
}: {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
  className?: string;
}) => {
  const particles = React.useMemo(() => {
    const density = particleDensity || 100;
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * ((maxSize || 3) - (minSize || 1)) + (minSize || 1),
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
  }, [particleDensity, minSize, maxSize]);

  return (
    <div className={cn("relative w-full h-full", className)}>
      <svg className="absolute inset-0 w-full h-full">
        {particles.map((particle) => (
          <motion.circle
            key={particle.id}
            cx={`${particle.x}%`}
            cy={`${particle.y}%`}
            r={particle.size}
            fill={particleColor || "#1976d2"}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
};
