"use client";

import React from "react";
import { motion } from "framer-motion";
import { CometCard } from "@/components/ui/comet-card";
import { Badge } from "@/components/ui/badge";
import { Upload, Brain, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: "1",
    title: "Upload Materials",
    description:
      "Upload your study materials - PDFs, images, or text files. Our AI processes and extracts key information.",
    icon: Upload,
  },
  {
    step: "2",
    title: "Generate Tests",
    description:
      "Choose your exam type, difficulty level, and topics. AI generates personalized mock test questions instantly.",
    icon: Brain,
  },
  {
    step: "3",
    title: "Practice & Improve",
    description:
      "Take timed tests, get instant results, and track your progress with detailed analytics and recommendations.",
    icon: BarChart3,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            How it Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Get started in 3 simple steps
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="flex"
            >
              <CometCard className="w-full">
                <div className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col min-h-[320px]">
                  <item.icon className="h-12 w-12 text-white bg-gradient-to-br from-primary to-primary/80 p-3 rounded-full mx-auto mb-6 shadow-lg" />
                  <h3 className="text-xl font-semibold mb-4 text-black dark:text-white text-center">
                    {item.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-center text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </CometCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
