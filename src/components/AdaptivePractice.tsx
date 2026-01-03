"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  Brain,
  Send,
  Bot,
  User,
  CheckCircle2,
  Target
} from 'lucide-react';

interface WeakTopic {
  topic: string;
  score: number;
  questionsAttempted: number;
  priority: 'high' | 'medium' | 'low';
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
}

interface Message {
  id: string;
  type: 'bot' | 'user' | 'options' | 'topics' | 'generating';
  content: string;
  options?: string[];
  topics?: WeakTopic[];
}

interface AdaptivePracticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  examType?: string;
  onStartWeakTopicsTest?: (config: {
    topics: string[];
    questionCount: number;
    difficulty: string;
  }) => void;
}

export function AdaptivePractice({
  open,
  onOpenChange,
  userId,
  examType = 'NEET',
  onStartWeakTopicsTest
}: AdaptivePracticeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('mixed');
  const [currentStep, setCurrentStep] = useState<'analyzing' | 'topics' | 'count' | 'difficulty' | 'confirm' | 'generating'>('analyzing');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}`;
  }, []);

  const addBotMessage = useCallback((content: string, delay: number = 500): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-${++messageIdCounter.current}`,
          type: 'bot',
          content
        }]);
        resolve();
      }, delay);
    });
  }, []);

  const addTopicsMessage = useCallback((topics: WeakTopic[]): void => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${++messageIdCounter.current}`,
      type: 'topics',
      content: '',
      topics
    }]);
  }, []);

  const addOptionsMessage = useCallback((options: string[]): void => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${++messageIdCounter.current}`,
      type: 'options',
      content: '',
      options
    }]);
  }, []);

  const addUserMessage = useCallback((content: string): void => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${++messageIdCounter.current}`,
      type: 'user',
      content
    }]);
  }, []);

  const startConversation = useCallback(async () => {
    // Show initial message immediately
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${++messageIdCounter.current}`,
        type: 'bot',
        content: "👋 Hey! I'm your AI Practice Assistant. Let me analyze your test history..."
      }]);
    }, 100);
    
    // Fetch weak topics
    try {
      const response = await fetch(`/api/adaptive-practice?userId=${userId}&examType=${examType}`);
      const data = await response.json();
      
      if (data.weakTopics && data.weakTopics.length > 0) {
        setWeakTopics(data.weakTopics);
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${++messageIdCounter.current}`,
            type: 'bot',
            content: `I found **${data.weakTopics.length} topics** where you need more practice! 📊`
          }]);
          
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${++messageIdCounter.current}`,
              type: 'bot',
              content: "Select the topics you want to focus on:"
            }]);
            setCurrentStep('topics');
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${++messageIdCounter.current}`,
              type: 'topics',
              content: '',
              topics: data.weakTopics
            }]);
          }, 300);
        }, 500);
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${++messageIdCounter.current}`,
            type: 'bot',
            content: "Great news! 🎉 I couldn't find any weak topics. You're doing amazing!"
          }]);
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${++messageIdCounter.current}`,
              type: 'bot',
              content: "Keep practicing to maintain your progress!"
            }]);
          }, 300);
        }, 400);
      }
    } catch {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-${++messageIdCounter.current}`,
          type: 'bot',
          content: "Oops! I had trouble analyzing your history. Please try again later."
        }]);
      }, 300);
    }
  }, [userId, examType]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Reset and start conversation when dialog opens
  useEffect(() => {
    if (open) {
      // Reset all state
      messageIdCounter.current = 0;
      setMessages([]);
      setSelectedTopics([]);
      setQuestionCount(10);
      setDifficulty('mixed');
      setCurrentStep('analyzing');
      setIsTyping(false);
      
      // Start conversation with minimal delay
      startConversation();
    }
  }, [open, startConversation]);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleTopicsConfirm = async () => {
    if (selectedTopics.length === 0) return;
    
    const topicNames = selectedTopics.length > 2 
      ? `${selectedTopics.slice(0, 2).join(', ')} and ${selectedTopics.length - 2} more`
      : selectedTopics.join(' and ');
    
    addUserMessage(`I want to practice: ${topicNames}`);
    setCurrentStep('count');
    
    await addBotMessage("Perfect choice! 🎯", 200);
    await addBotMessage("How many questions would you like?", 300);
    addOptionsMessage(['5 questions', '10 questions', '15 questions', '20 questions', '25 questions']);
  };

  const handleCountSelect = async (option: string) => {
    const count = parseInt(option);
    setQuestionCount(count);
    addUserMessage(option);
    setCurrentStep('difficulty');
    
    await addBotMessage(`${count} questions it is! 📝`, 200);
    await addBotMessage("What difficulty level do you prefer?", 300);
    addOptionsMessage(['Easy', 'Medium', 'Hard', 'Mixed (Recommended)']);
  };

  const handleDifficultySelect = async (option: string) => {
    const diff = option.toLowerCase().includes('mixed') ? 'mixed' : option.toLowerCase();
    setDifficulty(diff);
    addUserMessage(option);
    setCurrentStep('confirm');
    
    await addBotMessage("Awesome! Here's your test configuration:", 200);
    
    // Show summary
    const summary = `📚 **Topics:** ${selectedTopics.length} selected
📝 **Questions:** ${questionCount}
⚡ **Difficulty:** ${option}`;
    
    await addBotMessage(summary, 300);
    await addBotMessage("Ready to generate your personalized test?", 200);
    addOptionsMessage(['🚀 Start Test', '← Go Back']);
  };

  const handleConfirmSelect = async (option: string) => {
    if (option.includes('Start')) {
      addUserMessage("Let's go! 🚀");
      setCurrentStep('generating');
      
      await addBotMessage("Generating your personalized test... ✨", 300);
      
      // Add generating animation message
      setMessages(prev => [...prev, {
        id: 'generating',
        type: 'generating',
        content: ''
      }]);
      
      // Close dialog and start test
      setTimeout(() => {
        onOpenChange(false);
        if (onStartWeakTopicsTest) {
          onStartWeakTopicsTest({
            topics: selectedTopics,
            questionCount,
            difficulty
          });
        }
      }, 1000);
    } else {
      // Go back to topics
      addUserMessage("Let me reconfigure");
      setSelectedTopics([]);
      setCurrentStep('topics');
      await addBotMessage("No problem! Select the topics you want to practice:", 200);
      addTopicsMessage(weakTopics);
    }
  };

  const handleOptionClick = (option: string) => {
    if (currentStep === 'count') {
      handleCountSelect(option);
    } else if (currentStep === 'difficulty') {
      handleDifficultySelect(option);
    } else if (currentStep === 'confirm') {
      handleConfirmSelect(option);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] h-[85vh] max-h-[700px] p-0 gap-0 overflow-hidden flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800">
        {/* Visually hidden title for accessibility */}
        <VisuallyHidden.Root>
          <DialogTitle>AI Practice Assistant - Adaptive Question Generator</DialogTitle>
          <DialogDescription>Generate personalized practice tests based on your weak topics</DialogDescription>
        </VisuallyHidden.Root>
        
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#030213] to-[#1a1a2e] dark:from-purple-600 dark:to-purple-800">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Practice Assistant</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Personalized test generator</p>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {message.type === 'bot' && (
                  <div className="flex gap-2 items-start">
                    <div className="p-1.5 rounded-lg bg-[#030213] dark:bg-purple-600 shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700 max-w-[85%]">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                         dangerouslySetInnerHTML={{ 
                           __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                         }} 
                      />
                    </div>
                  </div>
                )}

                {message.type === 'user' && (
                  <div className="flex gap-2 items-start justify-end">
                    <div className="bg-[#030213] dark:bg-purple-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-white">{message.content}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  </div>
                )}

                {message.type === 'topics' && message.topics && (
                  <div className="space-y-2 pl-8">
                    {message.topics.map((topic) => (
                      <motion.button
                        key={topic.topic}
                        onClick={() => handleTopicSelect(topic.topic)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          selectedTopics.includes(topic.topic)
                            ? 'border-[#030213] dark:border-purple-500 bg-[#030213]/5 dark:bg-purple-500/10'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selectedTopics.includes(topic.topic)
                                  ? 'border-[#030213] dark:border-purple-500 bg-[#030213] dark:bg-purple-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {selectedTopics.includes(topic.topic) && (
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                )}
                              </span>
                              <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {topic.topic}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 ml-7">
                              <span className="text-xs text-gray-500">{topic.score}% • {topic.questionsAttempted} Qs</span>
                              <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(topic.priority)}`}>
                                {topic.priority === 'high' ? 'Needs Focus' : topic.priority === 'medium' ? 'Review' : 'Good'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    
                    {currentStep === 'topics' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-end pt-2"
                      >
                        <Button
                          onClick={handleTopicsConfirm}
                          disabled={selectedTopics.length === 0}
                          className="bg-[#030213] hover:bg-[#0a0a2e] dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
                        >
                          Continue with {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''}
                          <Send className="h-4 w-4 ml-2" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}

                {message.type === 'options' && message.options && (
                  <div className="flex flex-wrap gap-2 pl-8">
                    {message.options.map((option) => (
                      <motion.button
                        key={option}
                        onClick={() => handleOptionClick(option)}
                        className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#030213] hover:text-white hover:border-[#030213] dark:hover:bg-purple-600 dark:hover:border-purple-600 transition-all shadow-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                )}

                {message.type === 'generating' && (
                  <div className="flex gap-2 items-start">
                    <div className="p-1.5 rounded-lg bg-[#030213] dark:bg-purple-600 shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12">
                          <div className="absolute inset-0 rounded-full border-3 border-gray-100 dark:border-gray-700"></div>
                          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#030213] dark:border-t-purple-500 animate-spin"></div>
                          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#030213] to-[#1a1a2e] dark:from-purple-600 dark:to-purple-800 flex items-center justify-center">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Creating Your Test</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">AI is crafting questions for your weak topics...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 items-start"
            >
              <div className="p-1.5 rounded-lg bg-[#030213] dark:bg-purple-600 shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
