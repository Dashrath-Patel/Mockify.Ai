/**
 * AI Tutor Chat Component - ExamSensei
 * Multi-turn chat interface for students to ask doubts
 * Each question has its own chat context (fresh start per question)
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown,
  Loader2,
  User,
  Bot,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AITutorChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  topic?: string;
  questionIndex?: number;
}

interface MaterialReference {
  content: string;
  source: string;
  relevanceScore: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  materialReferences?: MaterialReference[];
  confidence?: 'high' | 'medium' | 'low';
  feedback?: 'helpful' | 'not-helpful' | null;
  timestamp: Date;
}

export function AITutorChat({
  open,
  onOpenChange,
  questionText,
  options,
  correctAnswer,
  userAnswer,
  topic,
  questionIndex
}: AITutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [fullText, setFullText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageStartRef = useRef<HTMLDivElement>(null);

  // Reset chat when question changes (different questionIndex = fresh context)
  useEffect(() => {
    if (open) {
      setMessages([]);
      setInputText('');
      setError(null);
      setStreamingText('');
      setIsStreaming(false);
      setFullText('');
    }
  }, [questionIndex, open]);

  // Streaming effect - types out fullText character by character
  useEffect(() => {
    if (!isStreaming || !fullText) return;
    
    let currentIndex = 0;
    const charsPerTick = 4;
    
    // Scroll to message start
    setTimeout(() => {
      if (messageStartRef.current) {
        messageStartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    
    const intervalId = setInterval(() => {
      currentIndex += charsPerTick;
      
      if (currentIndex >= fullText.length) {
        setStreamingText(fullText);
        setIsStreaming(false);
        clearInterval(intervalId);
      } else {
        setStreamingText(fullText.slice(0, currentIndex));
      }
    }, 20);
    
    return () => clearInterval(intervalId);
  }, [isStreaming, fullText]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/doubt-resolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          options,
          correctAnswer,
          userAnswer,
          doubtText: userMessage.content,
          topic,
          questionIndex,
          conversationHistory // Send previous messages for context
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.explanation,
        materialReferences: data.materialReferences || [],
        confidence: data.confidence,
        feedback: null,
        timestamp: new Date()
      };

      // Start streaming effect
      setFullText(data.explanation);
      setStreamingText('');
      setIsStreaming(true);
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, feedback: isHelpful ? 'helpful' : 'not-helpful' }
        : m
    ));
  };

  const clearChat = () => {
    setMessages([]);
    setInputText('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickSuggestions = [
    'Why is this the correct answer?',
    'Explain the concept step-by-step',
    'What are common mistakes here?',
    'Give me a similar example'
  ];

  const followUpSuggestions = [
    'Explain more',
    'Give an example',
    'Why not other options?'
  ];

  const confidenceConfig = {
    high: { color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400', label: '✓ High Confidence' },
    medium: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400', label: '~ Medium Confidence' },
    low: { color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400', label: 'General Answer' }
  };

  const formatMessage = (content: string) => {
    if (!content) return '';
    return content
      .replace(/###\s+(.*?)(\n|$)/g, '<h3 class="text-base font-bold mt-3 mb-2">$1</h3>')
      .replace(/##\s+(.*?)(\n|$)/g, '<h2 class="text-lg font-bold mt-3 mb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/^\*\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="mt-2">')
      .replace(/\n/g, '<br/>');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border border-border shadow-xl rounded-xl">
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>ExamSensei AI Tutor</DialogTitle>
          <DialogDescription>Chat with AI to understand the question better</DialogDescription>
        </VisuallyHidden>
        
        {/* Header - Simple dark theme */}
        <div className="bg-primary text-primary-foreground px-5 py-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">AI Tutor</h2>
                <p className="text-xs opacity-70">
                  Ask your doubt
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 h-8 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Context - Compact */}
        <div className="bg-muted/50 border-b border-border px-5 py-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/90 line-clamp-2">{questionText}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-medium">
                  ✓ {correctAnswer}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    userAnswer.charAt(0) === correctAnswer.charAt(0)
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                  )}
                >
                  {userAnswer.charAt(0) === correctAnswer.charAt(0) ? '✓' : '✗'} {userAnswer || 'Not answered'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background"
          style={{ minHeight: 0 }}
        >
          {/* Empty State */}
          {messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-8"
            >
              <div className="p-3 bg-muted rounded-full mb-3">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Ask your doubt
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                I&apos;ll explain the concept clearly
              </p>
              
              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {quickSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText(suggestion)}
                    className="text-xs hover:bg-accent transition-all"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isMessageStreaming = message.role === 'assistant' && isLastMessage && isStreaming;
              const contentToShow = isMessageStreaming ? streamingText : message.content;
              const shouldAttachRef = message.role === 'assistant' && isLastMessage;
              
              return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3 relative",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Invisible anchor for scrolling to message start */}
                {shouldAttachRef && <div ref={messageStartRef} className="absolute" />}
                {message.role === 'assistant' && (
                  <div className="p-1.5 bg-primary rounded-lg shrink-0 h-fit">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%] rounded-xl",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground px-4 py-2.5"
                    : "bg-muted/50 border border-border"
                )}>
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="p-4 space-y-3">
                      {/* Confidence Badge */}
                      {message.confidence && (
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", confidenceConfig[message.confidence].color)}
                        >
                          {confidenceConfig[message.confidence].label}
                        </Badge>
                      )}
                      
                      {/* Message Content with typing effect */}
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        <span dangerouslySetInnerHTML={{ __html: formatMessage(contentToShow) }} />
                        {/* Typing cursor indicator - inline with text */}
                        {isMessageStreaming && (
                          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>

                      {/* Material References - show after streaming completes */}
                      {!isMessageStreaming && message.materialReferences && message.materialReferences.length > 0 && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            From your materials:
                          </p>
                          <div className="space-y-2">
                            {message.materialReferences.slice(0, 2).map((ref, i) => (
                              <div 
                                key={i}
                                className="p-2 bg-muted/50 rounded-lg text-xs"
                              >
                                <Badge variant="secondary" className="text-[10px] mb-1">
                                  📄 {ref.source}
                                </Badge>
                                <p className="text-muted-foreground line-clamp-2">{ref.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback - show after streaming completes */}
                      {!isMessageStreaming && (
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">Was this helpful?</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, true)}
                            disabled={message.feedback !== null}
                            className={cn(
                              "h-6 w-6 p-0",
                              message.feedback === 'helpful' && "bg-green-100 text-green-600 dark:bg-green-900/30"
                            )}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, false)}
                            disabled={message.feedback !== null}
                            className={cn(
                              "h-6 w-6 p-0",
                              message.feedback === 'not-helpful' && "bg-red-100 text-red-600 dark:bg-red-900/30"
                            )}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="p-1.5 bg-muted rounded-lg shrink-0 h-fit">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            );
            })}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="p-1.5 bg-primary rounded-lg shrink-0 h-fit">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800"
            >
              <span>⚠️</span>
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto h-6 text-red-600 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background px-5 py-3 shrink-0">
          {/* Quick Suggestions for follow-up */}
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {followUpSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputText(suggestion)}
                  disabled={isLoading}
                  className="text-xs h-7 hover:bg-accent"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your doubt... (Enter to send)"
              rows={1}
              className="resize-none flex-1 min-h-[40px] max-h-[100px] text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !inputText.trim()}
              size="icon"
              className="shrink-0 h-10 w-10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
