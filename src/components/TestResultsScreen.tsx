"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { AITutorChat } from './AITutorChat';
import { AdaptivePractice } from './AdaptivePractice';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Target, 
  TrendingUp,
  Award,
  BarChart3,
  Home,
  RotateCcw,
  Download,
  Sparkles,
  Brain
} from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

interface TestResultsScreenProps {
  questions: Question[];
  userAnswers: Record<number, string>;
  timeSpent: number; // in seconds
  testTitle: string;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  userId?: string;
  examType?: string;
  onRetakeTest: () => void;
  onGoHome: () => void;
  onStartWeakTopicsTest?: (config: { topics: string[]; questionCount: number; difficulty: string }) => void;
}

export function TestResultsScreen({
  questions,
  userAnswers,
  timeSpent,
  testTitle,
  totalMarks,
  marksPerQuestion,
  negativeMarking,
  userId,
  examType = 'NEET',
  onRetakeTest,
  onGoHome,
  onStartWeakTopicsTest
}: TestResultsScreenProps) {
  // Calculate results
  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let score = 0;

    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      
      if (!userAnswer) {
        skipped++;
      } else {
        // Extract the letter from the user's answer (e.g., "A) Option text" -> "A")
        const userAnswerLetter = userAnswer.charAt(0).toUpperCase();
        const isCorrect = userAnswerLetter === q.correctAnswer.toUpperCase();
        
        if (isCorrect) {
          correct++;
          score += marksPerQuestion;
        } else {
          incorrect++;
          score -= negativeMarking;
        }
      }
    });

    const percentage = ((correct / questions.length) * 100).toFixed(1);
    const accuracy = questions.length - skipped > 0 
      ? ((correct / (questions.length - skipped)) * 100).toFixed(1)
      : '0';

    return {
      correct,
      incorrect,
      skipped,
      score: Math.max(0, score),
      percentage: parseFloat(percentage),
      accuracy: parseFloat(accuracy),
      attempted: questions.length - skipped
    };
  };

  const results = calculateResults();

  // AI Tutor state
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    topic: string;
    questionIndex: number;
  } | null>(null);

  // Adaptive Practice state
  const [adaptiveOpen, setAdaptiveOpen] = useState(false);

  const openAITutor = (q: Question, index: number) => {
    setSelectedQuestion({
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswers[index] || 'Not answered',
      topic: q.topic,
      questionIndex: index
    });
    setTutorOpen(true);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get performance message
  const getPerformanceMessage = () => {
    if (results.percentage >= 90) return { message: 'Outstanding Performance!', color: 'text-green-600 dark:text-green-400' };
    if (results.percentage >= 75) return { message: 'Excellent Work!', color: 'text-blue-600 dark:text-blue-400' };
    if (results.percentage >= 60) return { message: 'Good Effort!', color: 'text-black dark:text-white' };
    if (results.percentage >= 40) return { message: 'Keep Practicing!', color: 'text-amber-600 dark:text-amber-400' };
    return { message: 'Need More Practice', color: 'text-red-600 dark:text-red-400' };
  };

  const performance = getPerformanceMessage();

  // Get topic-wise analysis
  const getTopicAnalysis = () => {
    const topicData: Record<string, { correct: number; total: number }> = {};
    
    questions.forEach((q, index) => {
      const topic = q.topic || 'General';
      if (!topicData[topic]) {
        topicData[topic] = { correct: 0, total: 0 };
      }
      topicData[topic].total++;
      
      const userAnswer = userAnswers[index];
      if (userAnswer) {
        // Extract the letter from the user's answer
        const userAnswerLetter = userAnswer.charAt(0).toUpperCase();
        if (userAnswerLetter === q.correctAnswer.toUpperCase()) {
          topicData[topic].correct++;
        }
      }
    });

    return Object.entries(topicData).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      percentage: ((data.correct / data.total) * 100).toFixed(1)
    }));
  };

  const topicAnalysis = getTopicAnalysis();

  return (
    <div className="min-h-screen bg-[#F9F6F2] dark:bg-[#0a0a0a] pb-20 sm:pb-0\">\n      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#F9F6F2] dark:bg-[#1a1a1a] border-b-[3px] border-black dark:border-white"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 shrink-0" />
              <div>
                <h1 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Test Results
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px] sm:max-w-none">{testTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {userId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdaptiveOpen(true)}
                  className="flex items-center gap-1 sm:gap-2 border-primary text-primary hover:bg-primary/5 text-xs sm:text-sm"
                >
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Practice</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onGoHome} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button size="sm" onClick={onRetakeTest} className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Retake</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8\">
        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6\">"
          {/* Score Card - Large */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="rounded-2xl border-[3px] border-black dark:border-white shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 dark:from-amber-500 dark:via-orange-600 dark:to-red-600 border-b-[3px] border-black dark:border-white p-4 sm:p-8 text-center text-white">
                <Award className="h-10 w-10 sm:h-16 sm:w-16 mx-auto mb-2 sm:mb-4" />
                <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Your Score</h2>
                <div className="text-4xl sm:text-6xl font-bold mb-1 sm:mb-2">
                  {results.score.toFixed(1)}
                </div>
                <p className="text-base sm:text-xl opacity-90">out of {totalMarks}</p>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                  <p className={`text-xl sm:text-2xl font-bold ${performance.color.replace('dark:text', 'text').replace('text-', 'text-white')}`}>
                    {results.percentage}%
                  </p>
                  <p className="text-xs sm:text-sm opacity-75">{performance.message}</p>
                </div>
              </div>
              
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Time Taken:</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(timeSpent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                  <span className="font-semibold text-black dark:text-white">{results.accuracy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Attempted:</span>
                  <span className="font-semibold">{results.attempted}/{questions.length}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <Card className="rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-3 sm:pt-6 text-center">
                    <CheckCircle2 className="h-5 w-5 sm:h-8 sm:w-8 text-white mx-auto mb-1 sm:mb-2" />
                    <p className="text-xl sm:text-3xl font-bold text-white">{results.correct}</p>
                    <p className="text-[10px] sm:text-sm text-white/80">Correct</p>
                  </CardContent>
                </Card>

                <Card className="rounded-xl bg-gradient-to-br from-red-400 to-rose-500 dark:from-red-500 dark:to-rose-600 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-3 sm:pt-6 text-center">
                    <XCircle className="h-5 w-5 sm:h-8 sm:w-8 text-white mx-auto mb-1 sm:mb-2" />
                    <p className="text-xl sm:text-3xl font-bold text-white">{results.incorrect}</p>
                    <p className="text-[10px] sm:text-sm text-white/80">Incorrect</p>
                  </CardContent>
                </Card>

                <Card className="rounded-xl bg-gradient-to-br from-slate-300 to-gray-400 dark:from-slate-600 dark:to-gray-700 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-3 sm:pt-6 text-center">
                    <Target className="h-5 w-5 sm:h-8 sm:w-8 text-white mx-auto mb-1 sm:mb-2" />
                    <p className="text-xl sm:text-3xl font-bold text-white">{results.skipped}</p>
                    <p className="text-[10px] sm:text-sm text-white/80">Skipped</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-black dark:text-white" />
                    Performance Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {results.correct}/{questions.length}
                      </span>
                    </div>
                    <Progress value={(results.correct / questions.length) * 100} className="h-2 bg-emerald-100 dark:bg-emerald-950" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Incorrect Answers</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {results.incorrect}/{questions.length}
                      </span>
                    </div>
                    <Progress value={(results.incorrect / questions.length) * 100} className="h-2 bg-red-100 dark:bg-red-950" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Skipped</span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {results.skipped}/{questions.length}
                      </span>
                    </div>
                    <Progress value={(results.skipped / questions.length) * 100} className="h-2 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Topic-wise Analysis */}
            {topicAnalysis.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-black dark:text-white" />
                      Topic-wise Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topicAnalysis.map((topic, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{topic.topic}</span>
                            <span className="text-sm font-semibold">
                              {topic.correct}/{topic.total} ({topic.percentage}%)
                            </span>
                          </div>
                          <Progress 
                            value={parseFloat(topic.percentage)} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Detailed Solutions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <CardHeader>
              <CardTitle>Detailed Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
                  <TabsTrigger value="all" className="text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">All ({questions.length})</TabsTrigger>
                  <TabsTrigger value="correct" className="text-green-600 text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">Correct ({results.correct})</TabsTrigger>
                  <TabsTrigger value="incorrect" className="text-red-600 text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">Incorrect ({results.incorrect})</TabsTrigger>
                  <TabsTrigger value="skipped" className="text-gray-600 text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">Skipped ({results.skipped})</TabsTrigger>
                </TabsList>

                {['all', 'correct', 'incorrect', 'skipped'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-0">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-6">
                        {questions.map((q, index) => {
                          const userAnswer = userAnswers[index];
                          // Extract the letter from the user's answer for comparison
                          const userAnswerLetter = userAnswer ? userAnswer.charAt(0).toUpperCase() : '';
                          const isCorrect = userAnswerLetter === q.correctAnswer.toUpperCase();
                          const isSkipped = !userAnswer;

                          // Filter based on tab
                          if (tab === 'correct' && !isCorrect) return null;
                          if (tab === 'incorrect' && (isCorrect || isSkipped)) return null;
                          if (tab === 'skipped' && !isSkipped) return null;

                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-3 sm:p-6 rounded-lg border-2 ${
                                isSkipped 
                                  ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'
                                  : isCorrect 
                                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30'
                                  : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                              }`}
                            >
                              {/* Question Header */}
                              <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                  Question {index + 1}
                                </h3>
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
                                  <Badge variant={q.difficulty === 'easy' ? 'secondary' : q.difficulty === 'medium' ? 'default' : 'destructive'}>
                                    {q.difficulty}
                                  </Badge>
                                  {isSkipped ? (
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">Skipped</Badge>
                                  ) : isCorrect ? (
                                    <Badge className="bg-green-600">Correct</Badge>
                                  ) : (
                                    <Badge variant="destructive">Incorrect</Badge>
                                  )}
                                </div>
                              </div>

                              {/* Question Text */}
                              <p className="text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 text-sm sm:text-base">{q.question}</p>

                              {/* Options */}
                              <div className="space-y-2 mb-3 sm:mb-4">
                                {q.options.map((option, optIdx) => {
                                  const isUserAnswer = option === userAnswer;
                                  // Check if this option's letter matches the correct answer
                                  const optionLetter = option.charAt(0).toUpperCase();
                                  const isCorrectAnswer = optionLetter === q.correctAnswer.toUpperCase();

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2 sm:p-3 rounded-lg border ${
                                        isCorrectAnswer
                                          ? 'border-green-500 bg-green-100 dark:bg-green-950/50'
                                          : isUserAnswer
                                          ? 'border-red-500 bg-red-100 dark:bg-red-950/50'
                                          : 'border-gray-200 dark:border-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />}
                                        {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5" />}
                                        <span className={`text-sm sm:text-base ${isCorrectAnswer || isUserAnswer ? 'font-semibold' : ''}`}>
                                          {option}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation */}
                              {q.explanation && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Explanation:</p>
                                  <p className="text-sm text-blue-800 dark:text-blue-300">{q.explanation}</p>
                                </div>
                              )}

                              {/* Ask AI Tutor Button */}
                              <div className="mt-4 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAITutor(q, index)}
                                  className="flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 border-purple-300 dark:border-purple-700"
                                >
                                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  Ask AI Tutor
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Tutor Chat Dialog */}
        {selectedQuestion && (
          <AITutorChat
            open={tutorOpen}
            onOpenChange={setTutorOpen}
            questionText={selectedQuestion.questionText}
            options={selectedQuestion.options}
            correctAnswer={selectedQuestion.correctAnswer}
            userAnswer={selectedQuestion.userAnswer}
            topic={selectedQuestion.topic}
            questionIndex={selectedQuestion.questionIndex}
          />
        )}

        {/* Adaptive Practice Dialog */}
        {userId && (
          <AdaptivePractice
            open={adaptiveOpen}
            onOpenChange={setAdaptiveOpen}
            userId={userId}
            examType={examType}
            onStartWeakTopicsTest={onStartWeakTopicsTest}
          />
        )}
      </div>
    </div>
  );
}
