"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Clock, FileText, ArrowLeft, Play, CheckCircle, XCircle, MinusCircle, Calendar } from 'lucide-react';

interface TestInstructionsScreenProps {
  testTitle: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking?: number;
  onStartTest: () => void;
  onGoBack: () => void;
  onScheduleTest?: () => void;
}

export function TestInstructionsScreen({
  testTitle,
  duration,
  totalQuestions,
  totalMarks,
  marksPerQuestion,
  negativeMarking = 0.66,
  onStartTest,
  onGoBack,
  onScheduleTest
}: TestInstructionsScreenProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0a0a0a] dark:to-[#111]">
      {/* Floating Card Layout */}
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          {/* Main Card */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden">
            
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-[#030213] to-[#1a1a3a] dark:from-purple-900 dark:to-purple-800 px-8 py-10 text-center">
              <button
                onClick={onGoBack}
                className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                {testTitle}
              </h1>
              <p className="text-white/60 text-sm">
                Get ready for your test
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
              <div className="py-6 text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Questions</p>
              </div>
              <div className="py-6 text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{duration}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minutes</p>
              </div>
              <div className="py-6 text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalMarks}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Marks</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              
              {/* Marking Scheme - Horizontal Pills */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Marking</h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Correct: +{marksPerQuestion}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Wrong: -{negativeMarking}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <MinusCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Skip: 0</span>
                  </div>
                </div>
              </div>

              {/* Tips - Simple List */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Navigate using the question palette
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Mark questions to review later
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Auto-submit when time ends
                  </li>
                </ul>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-gray-800"></div>

              {/* Agreement & Start */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-[#030213] data-[state=checked]:border-[#030213]"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    I&apos;m ready to start this test
                  </span>
                </label>

                <Button
                  onClick={onStartTest}
                  disabled={!agreedToTerms}
                  className="w-full h-12 bg-[#030213] hover:bg-[#1a1a2e] dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Begin Test
                </Button>

                {onScheduleTest && (
                  <Button
                    onClick={onScheduleTest}
                    variant="outline"
                    className="w-full h-12 border-2 border-[#030213] dark:border-purple-600 text-[#030213] dark:text-purple-600 hover:bg-[#030213]/5 dark:hover:bg-purple-600/10 font-semibold rounded-xl transition-all"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule for Later
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timer starts immediately</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
