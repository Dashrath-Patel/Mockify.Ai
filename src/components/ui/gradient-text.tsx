import { motion } from "motion/react";
import { cn } from "./utils";

export const GradientText = ({
  children,
  className,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}) => {
  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400",
        animate && "bg-[length:200%_auto] animate-gradient",
        className
      )}
      style={{
        backgroundSize: animate ? "200% auto" : undefined,
      }}
      animate={
        animate
          ? {
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }
          : undefined
      }
    >
      {children}
    </motion.span>
  );
};
