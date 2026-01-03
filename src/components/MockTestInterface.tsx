"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Flag, 
  CheckCircle2,
  Circle,
  SkipForward,
  Maximize2,
  Volume2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-review' | 'answered-marked';

interface MockTestInterfaceProps {
  questions: Question[];
  testTitle: string;
  duration: number; // in minutes
  negativeMarking?: number; // negative marks per wrong answer
  onSubmitTest: (answers: Record<number, string>, timeSpent: number) => void;
  onExitTest: () => void;
}

export function MockTestInterface({
  questions,
  testTitle,
  duration,
  negativeMarking = 0.66,
  onSubmitTest,
  onExitTest
}: MockTestInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<number, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  // Toggle fullscreen mode
  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
        toast.success('Entered fullscreen mode');
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
        toast.info('Exited fullscreen mode');
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Fullscreen not supported');
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Scroll to top when test starts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Initialize question status
  useEffect(() => {
    const initialStatus: Record<number, QuestionStatus> = {};
    questions.forEach((_, index) => {
      initialStatus[index] = 'not-visited';
    });
    setQuestionStatus(initialStatus);
  }, [questions]);

  // Mark first question as visited
  useEffect(() => {
    if (questionStatus[0] === 'not-visited') {
      setQuestionStatus(prev => ({ ...prev, 0: 'not-answered' }));
    }
  }, []);

  // Load selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(answers[currentQuestion] || '');
  }, [currentQuestion, answers]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-submit when time runs out
  const handleAutoSubmit = () => {
    toast.error('Time is up! Submitting your test automatically.');
    const timeSpent = (duration * 60 - timeLeft);
    onSubmitTest(answers, timeSpent);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time color based on remaining time
  const getTimeColor = () => {
    const percentLeft = (timeLeft / (duration * 60)) * 100;
    if (percentLeft <= 10) return 'text-[#EF4444]';
    if (percentLeft <= 25) return 'text-[#FCD34D]';
    return 'text-[#86EFAC] dark:text-[#6EE7B7]';
  };

  // Navigate to specific question
  const goToQuestion = (index: number) => {
    // Mark current question as visited if not already
    if (questionStatus[index] === 'not-visited') {
      setQuestionStatus(prev => ({ ...prev, [index]: 'not-answered' }));
    }
    setCurrentQuestion(index);
  };

  // Save and next
  const handleSaveAndNext = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({ ...prev, [currentQuestion]: selectedAnswer }));
      
      // Update status
      const currentStatus = questionStatus[currentQuestion];
      if (currentStatus === 'marked-review' || currentStatus === 'answered-marked') {
        setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'answered-marked' }));
      } else {
        setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'answered' }));
      }
      
      // If this is the last question, check if all are complete
      if (currentQuestion === questions.length - 1) {
        // Schedule check for after state update
        setTimeout(() => checkAndAutoSubmit(), 100);
        return;
      }
    } else {
      toast.warning('Please select an answer before proceeding.', {
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        duration: 2000,
      });
      return;
    }
    
    // Move to next question
    if (currentQuestion < questions.length - 1) {
      goToQuestion(currentQuestion + 1);
    }
  };

  // Clear response
  const handleClearResponse = () => {
    setSelectedAnswer('');
    // Remove answer
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion];
    setAnswers(newAnswers);
    
    // Update status
    const currentStatus = questionStatus[currentQuestion];
    if (currentStatus === 'answered-marked') {
      setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'marked-review' }));
    } else {
      setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'not-answered' }));
    }
    
    toast.info('Response cleared. Remember to select an answer before submitting.', {
      duration: 2000,
    });
  };

  // Mark for review and next
  const handleMarkForReview = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({ ...prev, [currentQuestion]: selectedAnswer }));
      setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'answered-marked' }));
      toast.info('Question saved and marked for review.', { duration: 1500 });
    } else {
      // Still allow marking without answer, but warn user
      setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'marked-review' }));
      toast.warning('Question marked for review. Remember to answer it before submitting!', { 
        duration: 2500,
        icon: <Flag className="h-5 w-5 text-purple-500" />,
      });
    }
    
    // Move to next question
    if (currentQuestion < questions.length - 1) {
      goToQuestion(currentQuestion + 1);
    }
  };

  // Skip question - move to next without saving
  const handleSkipQuestion = () => {
    // Keep status as not-answered if not already answered
    if (!answers[currentQuestion]) {
      setQuestionStatus(prev => ({ ...prev, [currentQuestion]: 'not-answered' }));
    }
    
    // Clear selected answer for current question
    setSelectedAnswer('');
    
    // Move to next question
    if (currentQuestion < questions.length - 1) {
      goToQuestion(currentQuestion + 1);
      toast.info('Question skipped. You can come back to it later.', { 
        duration: 1500,
        icon: <SkipForward className="h-5 w-5 text-gray-500" />,
      });
    } else {
      // If on last question, go to first unanswered
      const firstUnanswered = Object.entries(questionStatus).find(
        ([_, status]) => status === 'not-answered' || status === 'not-visited'
      );
      if (firstUnanswered) {
        goToQuestion(parseInt(firstUnanswered[0]));
        toast.info('Last question! Jumping to first unanswered.', { duration: 1500 });
      } else {
        toast.info('This is the last question.', { duration: 1500 });
      }
    }
  };

  // Submit test
  const handleSubmit = () => {
    const timeSpent = (duration * 60 - timeLeft);
    onSubmitTest(answers, timeSpent);
    setShowSubmitDialog(false);
  };

  // Find first unanswered or marked question
  const findFirstIncompleteQuestion = (): { index: number; type: 'unanswered' | 'marked' | null } => {
    // First check for unanswered questions (not-visited, not-answered)
    for (let i = 0; i < questions.length; i++) {
      const status = questionStatus[i];
      if (status === 'not-visited' || status === 'not-answered') {
        return { index: i, type: 'unanswered' };
      }
    }
    
    // Then check for marked questions without answers
    for (let i = 0; i < questions.length; i++) {
      const status = questionStatus[i];
      if (status === 'marked-review') {
        return { index: i, type: 'marked' };
      }
    }
    
    return { index: -1, type: null };
  };

  // Validate before opening submit dialog
  const handleSubmitClick = () => {
    // Always allow submission - just show submit dialog with summary
    setShowSubmitDialog(true);
  };

  // Check if all questions are complete and auto-open submit dialog
  const checkAndAutoSubmit = () => {
    const incomplete = findFirstIncompleteQuestion();
    if (incomplete.type === null && currentQuestion === questions.length - 1) {
      // All questions answered, show submit dialog
      toast.success('All questions answered! You can now submit your test.', {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        duration: 3000,
      });
      setShowSubmitDialog(true);
    }
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      notVisited: 0,
    };

    Object.values(questionStatus).forEach(status => {
      if (status === 'answered' || status === 'answered-marked') counts.answered++;
      else if (status === 'marked-review') counts.markedForReview++;
      else if (status === 'not-answered') counts.notAnswered++;
      else if (status === 'not-visited') counts.notVisited++;
    });

    return counts;
  };

  // Get question palette button style
  const getQuestionButtonClass = (index: number) => {
    const status = questionStatus[index];
    const isActive = currentQuestion === index;

    let baseClass = "w-10 h-10 rounded flex items-center justify-center text-sm font-semibold transition-all ";
    
    if (isActive) {
      baseClass += "ring-4 ring-blue-500 dark:ring-blue-400 ring-inset ";
    }

    switch (status) {
      case 'not-visited':
        return baseClass + "border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300";
      case 'not-answered':
        return baseClass + "bg-red-500 text-white hover:bg-red-600";
      case 'answered':
        return baseClass + "bg-green-500 text-white hover:bg-green-600";
      case 'marked-review':
        return baseClass + "bg-purple-500 text-white hover:bg-purple-600";
      case 'answered-marked':
        return baseClass + "bg-green-500 text-white hover:bg-green-600 relative";
      default:
        return baseClass + "border-2 border-gray-400 bg-white text-gray-700";
    }
  };

  const currentQ = questions[currentQuestion];
  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-[#F9F6F2] dark:bg-[#0a0a0a]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-[#F9F6F2] dark:bg-[#1a1a1a] border-b-[3px] border-black dark:border-white shadow-sm"
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-6 w-6 text-black dark:text-white" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{testTitle}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${getTimeColor()}`} />
                <span className={`text-2xl font-bold tabular-nums ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullScreen}
                  className="hidden sm:flex border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all"
                  title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Question */}
          <div className="xl:col-span-3 space-y-4">
            {/* Section Info */}
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-full font-medium shadow-lg">
                SECTION: Test
              </span>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-[#86EFAC] dark:text-[#6EE7B7]">+2</span>
                  <span>Marks</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-[#EF4444]">-{negativeMarking}</span>
                  <span>Negative</span>
                </span>
              </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <CardContent className="pt-6">
                    {/* Question Text */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Question No. {currentQuestion + 1}
                      </h3>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base">
                        {currentQ.question}
                      </p>
                    </div>

                    {/* Options */}
                    <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                      <div className="space-y-3">
                        {currentQ.options.map((option, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div
                              className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                selectedAnswer === option
                                  ? 'border-violet-500 bg-violet-400/20 dark:bg-violet-500/20 border-[3px]'
                                  : 'border-gray-200 dark:border-slate-800 hover:border-[#86EFAC] dark:hover:border-[#6EE7B7]'
                              }`}
                              onClick={() => setSelectedAnswer(option)}
                            >
                              <RadioGroupItem
                                value={option}
                                id={`option-${idx}`}
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`option-${idx}`}
                                className="flex-1 cursor-pointer text-gray-800 dark:text-gray-200 leading-relaxed"
                              >
                                {option}
                              </Label>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <Card className="border-2 border-gray-200 dark:border-slate-800">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleMarkForReview}
                      className="flex items-center gap-2"
                    >
                      <Flag className="h-4 w-4" />
                      Mark for Review
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkipQuestion}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClearResponse}
                      disabled={!selectedAnswer}
                    >
                      Clear Response
                    </Button>
                    <Button
                      onClick={handleSaveAndNext}
                      className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-2 border-black font-bold"
                    >
                      Save & Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Question Palette */}
          <div className="xl:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Status Legend */}
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded"></div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{statusCounts.answered}</div>
                        <div className="text-gray-600 dark:text-gray-400">Answered</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded"></div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{statusCounts.notAnswered}</div>
                        <div className="text-gray-600 dark:text-gray-400">Not Answered</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 rounded"></div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{statusCounts.markedForReview}</div>
                        <div className="text-gray-600 dark:text-gray-400">Marked</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gray-400 dark:border-gray-600 rounded"></div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{statusCounts.notVisited}</div>
                        <div className="text-gray-600 dark:text-gray-400">Not Visited</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Palette */}
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Question Palette</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuestionPaper(true)}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, index) => (
                        <Button
                          key={index}
                          onClick={() => goToQuestion(index)}
                          className={getQuestionButtonClass(index)}
                          variant="ghost"
                        >
                          {index + 1}
                          {questionStatus[index] === 'answered-marked' && (
                            <Flag className="h-3 w-3 absolute -top-0.5 -right-0.5 fill-white" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitClick}
                className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white border-2 border-black font-semibold py-6 text-lg shadow-lg"
              >
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit the test? You cannot change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>
              <span className="font-semibold">{questions.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Answered:</span>
              <span className="font-semibold text-green-600">{statusCounts.answered}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Skipped / Not Answered:</span>
              <span className="font-semibold text-red-600">{statusCounts.notAnswered + statusCounts.notVisited}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Marked for Review:</span>
              <span className="font-semibold text-purple-600">{statusCounts.markedForReview}</span>
            </div>
            
            {/* Warning for skipped questions */}
            {(statusCounts.notAnswered + statusCounts.notVisited > 0) && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  You have {statusCounts.notAnswered + statusCounts.notVisited} skipped question(s). Skipped questions will be marked as incorrect.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Continue Test
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-[#86EFAC] hover:bg-[#6EE7B7] text-black border-2 border-black "
            >
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Paper Dialog */}
      <Dialog open={showQuestionPaper} onOpenChange={setShowQuestionPaper}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Question Paper</DialogTitle>
            <DialogDescription>
              You can click on the scroll bar and drag it to scroll the page. The scroll wheel is disabled to provide you Real Exam experience.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-slate-800 pb-6 last:border-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Q. {index + 1}) {q.question}
                  </h3>
                  <div className="space-y-2 ml-4">
                    {q.options.map((option, optIdx) => (
                      <p key={optIdx} className="text-sm text-gray-700 dark:text-gray-300">
                        {String.fromCharCode(65 + optIdx)}. {option}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setShowQuestionPaper(false)}>
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
