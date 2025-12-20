"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, FileText, AlertTriangle, CheckCircle2, Circle, Flag, Eye } from 'lucide-react';

interface TestInstructionsScreenProps {
  testTitle: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking?: number;
  onStartTest: () => void;
  onGoBack: () => void;
}

export function TestInstructionsScreen({
  testTitle,
  duration,
  totalQuestions,
  totalMarks,
  marksPerQuestion,
  negativeMarking = 0.66,
  onStartTest,
  onGoBack
}: TestInstructionsScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F6F2] dark:bg-[#0a0a0a]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-[#F9F6F2] dark:bg-[#1a1a1a] border-b-[3px] border-black dark:border-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={onGoBack}
              className="flex items-center gap-2 border-[3px] border-black dark:border-white bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all font-bold text-black dark:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tests
            </Button>
            
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-black dark:text-white" />
                {testTitle}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Duration: {duration} Mins</p>
                <p className="text-sm font-bold text-black dark:text-white">Maximum Marks: {totalMarks}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Instructions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="bg-[#86EFAC] dark:bg-[#6EE7B7] border-b-[3px] border-black dark:border-white">
                  <CardTitle className="text-lg font-bold text-black">
                    General Instructions:
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <ol className="space-y-3 list-decimal list-inside text-black dark:text-gray-200 font-medium">
                    <li>
                      The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.
                    </li>
                    <li>
                      The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                      <div className="mt-3 space-y-2 ml-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 border-[3px] border-black dark:border-white rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]" />
                          <span>You have not visited the question yet.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#EF4444] border-2 border-black dark:border-white rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                          <span>You have not answered the question.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-violet-400 to-purple-500 border-2 border-black dark:border-white rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                          <span>You have answered the question.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#FCD34D] border-2 border-black dark:border-white rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                          <span>You have NOT answered the question, but have marked the question for review.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#60A5FA] border-2 border-black dark:border-white rounded relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <CheckCircle2 className="h-4 w-4 text-black absolute top-0 right-0" />
                          </div>
                          <span>You have answered the question, but marked it for review.</span>
                        </div>
                      </div>
                    </li>
                  </ol>
                  <div className="mt-4 p-4 bg-[#FCD34D] dark:bg-[#FCD34D] border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm text-black flex items-start gap-2 font-medium">
                      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-black" />
                      <span>
                        The <strong>Mark For Review</strong> status for a question simply indicates that you would like to look at that question again. If a question is answered, but marked for review, then the answer will be considered for evaluation unless the status is modified by the candidate.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Navigating to a Question */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 border-b-[3px] border-black dark:border-white">
                  <CardTitle className="text-lg font-bold text-black">
                    Navigating to a Question:
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-black dark:text-gray-200 mb-3 font-medium">
                    To answer a question, do the following:
                  </p>
                  <ol className="space-y-3 list-decimal list-inside text-black dark:text-gray-200 font-medium">
                    <li>
                      Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.
                    </li>
                    <li>
                      Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.
                    </li>
                    <li>
                      Click on <strong>Mark for Review & Next</strong> to save your answer for the current question and also mark it for review, and then go to the next question.
                    </li>
                  </ol>
                  <div className="mt-4 p-4 bg-[#60A5FA] dark:bg-[#60A5FA] border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm text-black font-medium">
                      Note that your answer for the current question will not be saved, if you navigate to another question directly by clicking on a question number without saving the answer to the previous question.
                    </p>
                  </div>
                  <p className="mt-4 text-black dark:text-gray-200 font-medium">
                    You can view all the questions by clicking on the <strong>Question Paper</strong> button. <span className="text-[#EF4444] font-bold">This feature is provided, so that if you want you can just see the entire question paper at a glance.</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Answering a Question */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="bg-gradient-to-r from-violet-400 to-purple-500 dark:from-violet-500 dark:to-purple-600 border-b-[3px] border-black dark:border-white">
                  <CardTitle className="text-lg font-bold text-white">
                    Answering a Question:
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-black dark:text-white mb-2">
                        Procedure for answering a multiple choice (MCQ) type question:
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside text-black dark:text-gray-200 ml-4 font-medium">
                        <li>Choose one answer from the 4 options (A,B,C,D) given below the question, click on the bubble placed before the chosen option.</li>
                        <li>To deselect your chosen answer, click on the bubble of the chosen option again or click on the <strong>Clear Response</strong> button</li>
                        <li>To change your chosen answer, click on the bubble of another option.</li>
                        <li>To save your answer, you MUST click on the <strong>Save & Next</strong></li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-black dark:text-white mb-2">
                        Procedure for answering a numerical answer type question:
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside text-black dark:text-gray-200 ml-4 font-medium">
                        <li>To enter a number as your answer, use the virtual numerical keypad.</li>
                        <li>A fraction (e.g. -0.3 or -3) can be entered as an answer with or without "0" before the decimal point. <span className="text-[#EF4444] font-bold">As many as four decimal points, e.g. 12.5435 or 0.003 or -932.6711 or 12.82 can be entered.</span></li>
                        <li>To clear your answer, click on the <strong>Clear Response</strong> button</li>
                        <li>To save your answer, you MUST click on the <strong>Save & Next</strong></li>
                      </ol>
                    </div>

                    <div>
                      <p className="text-gray-700 dark:text-gray-300">
                        To mark a question for review, click on the <strong>Mark for Review & Next</strong> button. If an answer is selected (for MCQ/MCAQ) entered (for numerical answer type) for a question that is <strong>Marked for Review</strong>, that answer will be considered in the evaluation unless the status is modified by the candidate.
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-700 dark:text-gray-300">
                        To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Test Details & Start */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-24 space-y-6"
            >
              {/* Test Details Card */}
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 border-b-[3px] border-black dark:border-white">
                  <CardTitle className="text-lg font-bold text-white">Test Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Read the following instructions carefully.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b-2 border-black dark:border-white">
                      <span className="text-sm text-[#555555] dark:text-gray-400 font-medium">Total Questions:</span>
                      <span className="font-bold text-black dark:text-white">{totalQuestions}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-black dark:border-white">
                      <span className="text-sm text-[#555555] dark:text-gray-400 font-medium">Time Duration:</span>
                      <span className="font-bold text-black dark:text-white">{duration} minutes</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-black dark:border-white">
                      <span className="text-sm text-[#555555] dark:text-gray-400 font-medium">Marks per Question:</span>
                      <span className="font-bold text-[#86EFAC] dark:text-[#6EE7B7]">+{marksPerQuestion}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-black dark:border-white">
                      <span className="text-sm text-[#555555] dark:text-gray-400 font-medium">Negative Marking:</span>
                      <span className="font-bold text-[#EF4444]">-{negativeMarking}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-[#555555] dark:text-gray-400 font-medium">Total Marks:</span>
                      <span className="font-bold text-lg text-black dark:text-white">{totalMarks}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-black dark:text-gray-200 mb-2 font-medium">
                      You can write this test only once. Make sure that you complete the test before you submit the test and/or close the browser.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Language Selection & Start */}
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-black dark:text-white mb-2 block">
                      Choose your default language:
                    </label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-full border-2 border-black dark:border-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] font-medium">
                        <SelectValue placeholder="-- Select --" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black dark:border-white">
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#EF4444] font-bold mt-2">
                      Please note all questions will appear in default language. This language can be changed for a particular question later on.
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-black dark:border-white">
                    <p className="text-sm font-bold text-black dark:text-white mb-3">Declaration:</p>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="terms" 
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        className="mt-1 border-2 border-black dark:border-white"
                      />
                      <label 
                        htmlFor="terms" 
                        className="text-xs text-black dark:text-gray-200 leading-relaxed cursor-pointer font-medium"
                      >
                        I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification. The decision of MockifyAI will be final in these matters and cannot be appealed.
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={onStartTest}
                      disabled={!agreedToTerms}
                      className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] font-bold disabled:opacity-50"
                    >
                      I am ready to begin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
