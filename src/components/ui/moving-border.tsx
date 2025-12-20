import React from "react";
import { motion } from "motion/react";
import { cn } from "./utils";

export const MovingBorder = ({
  children,
  duration = 2000,
  className,
  containerClassName,
  borderClassName,
  as: Component = "button",
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: any;
  [key: string]: any;
}) => {
  return (
    <Component
      className={cn(
        "bg-transparent relative text-xl p-[1px] overflow-hidden",
        containerClassName
      )}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ padding: "1px" }}
      >
        <motion.div
          className={cn(
            "h-20 w-20 opacity-[0.8] bg-[radial-gradient(#1976d2_40%,transparent_60%)]",
            borderClassName
          )}
          style={{
            position: "absolute",
            background:
              "radial-gradient(circle, #1976d2 20%, transparent 60%)",
          }}
          animate={{
            top: ["-50%", "150%"],
            left: ["-50%", "150%"],
          }}
          transition={{
            duration: duration / 1000,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div
        className={cn(
          "relative bg-slate-900/[0.8] border border-slate-800 backdrop-blur-xl text-white flex items-center justify-center w-full h-full text-sm antialiased",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};
