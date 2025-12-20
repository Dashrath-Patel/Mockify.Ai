import React from 'react';
import { motion } from 'motion/react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo/Brand spinner */}
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 blur-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-30 rounded-full scale-150" />
        
        {/* Main loader container */}
        <div className="relative w-20 h-20">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
          
          {/* Spinning gradient ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #030213, transparent)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Inner circle with icon */}
          <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-lg">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#030213] to-[#1a1a2e] dark:from-purple-600 dark:to-purple-800 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Loading dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#030213] dark:bg-purple-500"
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity, 
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Loader;
