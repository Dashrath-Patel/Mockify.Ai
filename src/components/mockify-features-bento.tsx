"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import {
  IconBrain,
  IconUpload,
  IconChartBar,
  IconClock,
  IconBulb,
  IconBook,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";

export function MockifyFeaturesBento() {
  return (
    <div className="py-20 lg:py-40">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
          Everything You Need to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Ace Your Exams
          </span>
        </h2>
        <p className="text-black max-w-2xl mx-auto font-medium text-lg">
          Powerful features designed to transform your exam preparation
        </p>
      </div>
      
      <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[20rem] px-4">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={cn("[&>p:text-lg]", item.className)}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

const AIGeneration = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] p-6">
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          {/* Central AI Icon */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(147, 51, 234, 0.4)",
                "0 0 0 20px rgba(147, 51, 234, 0)",
                "0 0 0 0 rgba(147, 51, 234, 0)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center relative z-10"
          >
            <IconBrain className="h-10 w-10 text-white" />
          </motion.div>

          {/* Floating Question Bubbles */}
          <motion.div
            animate={{
              y: [-5, 5, -5],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-6 -right-6 w-10 h-10 bg-purple-500/30 backdrop-blur-sm border border-purple-500/50 rounded-lg flex items-center justify-center"
          >
            <span className="text-xs font-bold text-purple-600 dark:text-purple-300">Q1</span>
          </motion.div>

          <motion.div
            animate={{
              y: [5, -5, 5],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -bottom-6 -left-6 w-10 h-10 bg-blue-500/30 backdrop-blur-sm border border-blue-500/50 rounded-lg flex items-center justify-center"
          >
            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">Q2</span>
          </motion.div>

          <motion.div
            animate={{
              y: [-3, 3, -3],
              rotate: [0, 3, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="absolute top-8 -left-8 w-10 h-10 bg-cyan-500/30 backdrop-blur-sm border border-cyan-500/50 rounded-lg flex items-center justify-center"
          >
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-300">Q3</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const SmartUpload = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <motion.div
          whileHover="animate"
          className="p-6 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        >
          <div className="flex flex-col items-center justify-center">
            <motion.div
              className="relative z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-20 w-20 rounded-md shadow-lg"
              initial={{ y: 0 }}
              whileHover={{ y: -5 }}
            >
              <IconUpload className="h-8 w-8 text-neutral-600 dark:text-neutral-300" />
            </motion.div>
            <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-sm mt-4">
              Upload file
            </p>
            <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-xs mt-1 text-center">
              Drag or drop files here
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Analytics = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full h-full relative rounded-lg overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
          alt="Performance Analytics"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

const TimedTests = () => {
  const [time, setTime] = React.useState({ hours: 1, minutes: 30, seconds: 0, milliseconds: 0 });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        let { hours, minutes, seconds, milliseconds } = prevTime;
        
        if (milliseconds > 0) {
          milliseconds -= 10;
        } else {
          milliseconds = 990;
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          } else {
            // Timer finished, reset or stop
            return prevTime;
          }
        }
        
        return { hours, minutes, seconds, milliseconds };
      });
    }, 10);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {String(time.hours).padStart(2, '0')}
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Hours</span>
        </div>
        <div className="text-4xl font-bold text-neutral-600 dark:text-neutral-400">:</div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {String(time.minutes).padStart(2, '0')}
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Minutes</span>
        </div>
        <div className="text-4xl font-bold text-neutral-600 dark:text-neutral-400">:</div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {String(time.seconds).padStart(2, '0')}
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Seconds</span>
        </div>
        <div className="text-4xl font-bold text-neutral-600 dark:text-neutral-400">:</div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {String(time.milliseconds).padStart(3, '0')}
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Milliseconds</span>
        </div>
      </div>
    </div>
  );
};

const items = [
  {
    title: "AI Question Generation",
    description: (
      <span className="text-sm">
        Advanced AI analyzes your study materials and generates personalized mock test questions tailored to your exam needs.
      </span>
    ),
    header: <AIGeneration />,
    className: "md:col-span-2",
    icon: <IconBrain className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Smart Material Upload",
    description: (
      <span className="text-sm">
        Upload PDFs, images, or text files. Our OCR technology extracts content and prepares it for intelligent question generation.
      </span>
    ),
    header: <SmartUpload />,
    className: "md:col-span-1",
    icon: <IconUpload className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Performance Analytics",
    description: (
      <span className="text-sm">
        Detailed analytics reveal your strengths and weaknesses. Track progress over time and identify areas needing focused attention.
      </span>
    ),
    header: <Analytics />,
    className: "md:col-span-1",
    icon: <IconChartBar className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Timed Practice Tests",
    description: (
      <span className="text-sm">
        Simulate real exam conditions with timed tests. Build speed and accuracy while managing time pressure effectively.
      </span>
    ),
    header: <TimedTests />,
    className: "md:col-span-2",
    icon: <IconClock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Adaptive Learning",
    description: (
      <span className="text-sm">
        AI adapts to your performance, generating more questions on weak topics and adjusting difficulty based on your improvement.
      </span>
    ),
    header: (
      <div className="flex flex-1 w-full h-full min-h-24 rounded-xl overflow-hidden bg-linear-to-br from-blue-50 to-purple-50 p-4">
        <div className="w-full h-full relative rounded-lg overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <img
            src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=600&fit=crop"
            alt="Adaptive Learning"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
    className: "md:col-span-1",
    icon: <IconBulb className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Study Materials Library",
    description: (
      <span className="text-sm">
        Organize and access all your study materials in one place. Easy management of PDFs, notes, and practice questions.
      </span>
    ),
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] p-6 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Stacked Cards Effect - Background Cards */}
          <motion.div
            animate={{
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-full max-w-xs h-48 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-2xl"
            style={{ transform: "translateY(20px) scale(0.9)", opacity: 0.5 }}
          />
          
          <motion.div
            animate={{
              rotate: [1, -1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-full max-w-xs h-48 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl shadow-2xl"
            style={{ transform: "translateY(10px) scale(0.95)", opacity: 0.7 }}
          />
          
          {/* Main Front Card */}
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-xs h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-6 cursor-pointer"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  <IconBook className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">My Library</div>
                  <div className="text-xs text-white/70">20 files</div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
              >
                <span className="text-xs text-white font-bold">★</span>
              </motion.div>
            </div>
            
            {/* File Icons Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { icon: '📄', color: 'from-red-400 to-red-600', label: 'PDF' },
                { icon: '📊', color: 'from-blue-400 to-blue-600', label: 'DOC' },
                { icon: '📝', color: 'from-green-400 to-green-600', label: 'TXT' },
                { icon: '🖼️', color: 'from-yellow-400 to-orange-600', label: 'IMG' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * idx, duration: 0.3 }}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className={`aspect-square bg-gradient-to-br ${item.color} rounded-xl flex flex-col items-center justify-center shadow-lg cursor-pointer`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[8px] text-white font-bold mt-1">{item.label}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Storage</span>
                <span>12.4 MB / 100 MB</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "12.4%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-white to-cyan-200 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    ),
    className: "md:col-span-2",
    icon: <IconBook className="h-4 w-4 text-neutral-500" />,
  },
];
