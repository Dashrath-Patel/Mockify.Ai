"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/ui/aceternity/loader";
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Timer,
  Flag,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { navigationEvents } from "@/lib/navigation-events";

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  marks: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  time_limit: number;
  total_marks: number;
  questions: Question[];
}

interface UserAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  flagged: boolean;
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (test && startTime && !isSubmitted) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const remaining = Math.max(0, test.time_limit * 60 - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          handleSubmitTest();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test, startTime, isSubmitted]);

  const fetchTest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigationEvents.start('/login');
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('tests')
        .select(`
          id,
          title,
          description,
          time_limit,
          total_marks,
          questions (
            id,
            question_text,
            question_type,
            options,
            correct_answer,
            explanation,
            marks
          )
        `)
        .eq('id', testId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast.error('Test not found');
        navigationEvents.start('/dashboard');
        router.push('/dashboard');
        return;
      }

      setTest(data);
      setTimeRemaining(data.time_limit * 60);
      setStartTime(new Date());
      setQuestionStartTime(new Date());
    } catch (error) {
      toast.error('Error loading test');
      navigationEvents.start('/dashboard');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = test?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const now = new Date();
    const timeSpent = questionStartTime 
      ? Math.floor((now.getTime() - questionStartTime.getTime()) / 1000)
      : 0;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        answer,
        timeSpent: (prev[currentQuestion.id]?.timeSpent || 0) + timeSpent,
        flagged: prev[currentQuestion.id]?.flagged || false
      }
    }));

    setQuestionStartTime(now);
  };

  const toggleFlag = () => {
    const currentQuestion = test?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        questionId: currentQuestion.id,
        answer: prev[currentQuestion.id]?.answer || '',
        timeSpent: prev[currentQuestion.id]?.timeSpent || 0,
        flagged: !prev[currentQuestion.id]?.flagged
      }
    }));
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < (test?.questions.length || 0)) {
      const now = new Date();
      const currentQuestion = test?.questions[currentQuestionIndex];
      
      if (currentQuestion && questionStartTime) {
        const timeSpent = Math.floor((now.getTime() - questionStartTime.getTime()) / 1000);
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            ...prev[currentQuestion.id],
            questionId: currentQuestion.id,
            answer: prev[currentQuestion.id]?.answer || '',
            timeSpent: (prev[currentQuestion.id]?.timeSpent || 0) + timeSpent,
            flagged: prev[currentQuestion.id]?.flagged || false
          }
        }));
      }

      setCurrentQuestionIndex(index);
      setQuestionStartTime(now);
    }
  };

  const handleSubmitTest = async () => {
    if (!test || !startTime) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const endTime = new Date();
      const totalTimeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Calculate score
      let correctAnswers = 0;
      let totalMarks = 0;
      let scoredMarks = 0;

      test.questions.forEach(question => {
        const userAnswer = answers[question.id];
        totalMarks += question.marks;
        
        if (userAnswer && question.correct_answer) {
          if (userAnswer.answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()) {
            correctAnswers++;
            scoredMarks += question.marks;
          }
        }
      });

      const percentage = totalMarks > 0 ? Math.round((scoredMarks / totalMarks) * 100) : 0;

      // Save test result
      const { error: resultError } = await supabase
        .from('test_results')
        .insert({
          test_id: testId,
          user_id: user.id,
          answers: JSON.stringify(answers),
          score: percentage,
          total_questions: test.questions.length,
          correct_answers: correctAnswers,
          time_spent: totalTimeSpent,
          completed_at: endTime.toISOString()
        });

      if (resultError) {
        console.error('Error saving test result:', resultError);
        toast.error('Error saving test result');
      } else {
        toast.success('Test submitted successfully!');
        setIsSubmitted(true);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Error submitting test');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(questionId => answers[questionId]?.answer).length;
  };

  const getFlaggedCount = () => {
    return Object.keys(answers).filter(questionId => answers[questionId]?.flagged).length;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-32 h-32">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Test not found</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const currentQuestion = test.questions[currentQuestionIndex];
    const userAnswer = answers[currentQuestion?.id];
    const isCorrect = userAnswer && currentQuestion?.correct_answer && 
      userAnswer.answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-green-600">Test Completed!</CardTitle>
                <CardDescription>
                  You have successfully completed "{test.title}"
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((Object.keys(answers).filter(id => {
                    const q = test.questions.find(q => q.id === id);
                    const a = answers[id];
                    return a && q?.correct_answer && 
                      a.answer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
                  }).length / test.questions.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{getAnsweredCount()}</div>
                <div className="text-sm text-muted-foreground">Answered</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(answers).filter(id => {
                    const q = test.questions.find(q => q.id === id);
                    const a = answers[id];
                    return a && q?.correct_answer && 
                      a.answer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0)}
                </div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={() => setShowSolutions(!showSolutions)} variant="outline">
                {showSolutions ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showSolutions ? 'Hide' : 'Show'} Solutions
              </Button>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {showSolutions && (
          <div className="space-y-6">
            {test.questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer && question.correct_answer && 
                userAnswer.answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();

              return (
                <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Question {index + 1}
                        {isCorrect ? (
                          <CheckCircle className="inline ml-2 h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="inline ml-2 h-5 w-5 text-red-500" />
                        )}
                      </CardTitle>
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <CardDescription>{question.question_text}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Your Answer:</Label>
                        <p className={`mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {userAnswer?.answer || 'Not answered'}
                        </p>
                      </div>
                      
                      {question.correct_answer && (
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground">Correct Answer:</Label>
                          <p className="mt-1 text-green-600 font-medium">
                            {question.correct_answer}
                          </p>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground">Explanation:</Label>
                          <p className="mt-1 text-muted-foreground">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground">{test.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded">
              <Timer className="h-4 w-4" />
              <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Button onClick={handleSubmitTest} size="sm">
              Submit Test
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 text-sm text-muted-foreground mb-4">
          <span>Question {currentQuestionIndex + 1} of {test.questions.length}</span>
          <span>•</span>
          <span>{getAnsweredCount()} answered</span>
          <span>•</span>
          <span>{getFlaggedCount()} flagged</span>
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {test.questions.map((question, index) => {
                  const userAnswer = answers[question.id];
                  const isAnswered = userAnswer?.answer;
                  const isFlagged = userAnswer?.flagged;
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <Button
                      key={question.id}
                      variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                      size="sm"
                      className={`relative ${isFlagged ? 'ring-2 ring-orange-500' : ''}`}
                      onClick={() => navigateToQuestion(index)}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
                      )}
                    </Button>
                  );
                })}
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-muted-foreground rounded"></div>
                  <span>Not answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-3 h-3 text-orange-500" />
                  <span>Flagged</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Question Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {currentQuestion.question_text}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentQuestion.marks} marks</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlag}
                    className={answers[currentQuestion.id]?.flagged ? 'bg-orange-100 text-orange-700' : ''}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.answer || ''}
                  onValueChange={handleAnswerChange}
                >
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.question_type === 'true_false' && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.answer || ''}
                  onValueChange={handleAnswerChange}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="True" id="true" />
                      <Label htmlFor="true" className="cursor-pointer">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="False" id="false" />
                      <Label htmlFor="false" className="cursor-pointer">False</Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
                <Textarea
                  value={answers[currentQuestion.id]?.answer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={currentQuestion.question_type === 'essay' ? 'Write your detailed answer here...' : 'Enter your answer here...'}
                  className={currentQuestion.question_type === 'essay' ? 'min-h-32' : 'min-h-20'}
                />
              )}

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                {currentQuestionIndex < test.questions.length - 1 ? (
                  <Button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmitTest}>
                    Submit Test
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}