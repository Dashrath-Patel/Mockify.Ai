/**
 * Adaptive Practice API Route
 * Generates personalized practice questions based on weak topics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeWeakTopics,
  createAdaptivePracticeSet,
  savePracticeSession,
  WeakTopic,
  AdaptiveQuestion
} from '@/lib/agents/adaptive-question-agent';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET: Analyze and return user's weak topics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Analyze weak topics
    const weakTopics = await analyzeWeakTopics(userId);

    if (weakTopics.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No weak topics found! You are performing well across all topics.',
        weakTopics: [],
        recommendations: [
          'Continue practicing to maintain your performance',
          'Try taking advanced difficulty tests',
          'Explore new topics to expand your knowledge'
        ]
      });
    }

    return NextResponse.json({
      success: true,
      weakTopics,
      summary: {
        totalWeakTopics: weakTopics.length,
        highPriority: weakTopics.filter(t => t.priority === 'high').length,
        mediumPriority: weakTopics.filter(t => t.priority === 'medium').length,
        lowPriority: weakTopics.filter(t => t.priority === 'low').length,
        averageScore: Math.round(
          weakTopics.reduce((sum, t) => sum + t.score, 0) / weakTopics.length
        )
      }
    });

  } catch (error) {
    console.error('Error analyzing weak topics:', error);
    return NextResponse.json(
      { error: 'Failed to analyze weak topics' },
      { status: 500 }
    );
  }
}

/**
 * POST: Generate adaptive practice questions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      questionCount = 5, 
      examType = 'NEET',
      selectedTopics // Optional: specific topics to focus on
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Generate adaptive practice set
    const practiceSet = await createAdaptivePracticeSet(
      userId,
      questionCount,
      examType
    );

    if (!practiceSet) {
      return NextResponse.json({
        success: true,
        message: 'Congratulations! No weak topics found. You are performing excellently!',
        questions: [],
        weakTopics: []
      });
    }

    return NextResponse.json({
      success: true,
      practiceSession: {
        weakTopics: practiceSet.weakTopics,
        questions: practiceSet.questions,
        generatedAt: practiceSet.generatedAt
      },
      tips: generatePracticeTips(practiceSet.weakTopics)
    });

  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate practice questions' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Submit practice session results
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      questions, 
      answers, 
      weakTopics 
    }: {
      userId: string;
      questions: AdaptiveQuestion[];
      answers: Record<number, string>;
      weakTopics: WeakTopic[];
    } = body;

    if (!userId || !questions || !answers) {
      return NextResponse.json(
        { error: 'userId, questions, and answers are required' },
        { status: 400 }
      );
    }

    // Save practice session and get results
    const result = await savePracticeSession(
      userId,
      questions,
      answers,
      weakTopics || []
    );

    return NextResponse.json({
      success: true,
      score: result.score,
      improvement: result.improvement,
      message: result.score >= 70 
        ? 'Great improvement! Keep practicing!' 
        : 'Keep practicing to improve your weak areas.'
    });

  } catch (error) {
    console.error('Error saving practice session:', error);
    return NextResponse.json(
      { error: 'Failed to save practice session' },
      { status: 500 }
    );
  }
}

/**
 * Generate practice tips based on weak topics
 */
function generatePracticeTips(weakTopics: WeakTopic[]): string[] {
  const tips: string[] = [];

  const highPriority = weakTopics.filter(t => t.priority === 'high');
  const mediumPriority = weakTopics.filter(t => t.priority === 'medium');

  if (highPriority.length > 0) {
    tips.push(`Focus first on: ${highPriority.map(t => t.topic).join(', ')}`);
    tips.push('Start with easier questions to build confidence');
  }

  if (mediumPriority.length > 0) {
    tips.push(`Also practice: ${mediumPriority.map(t => t.topic).join(', ')}`);
  }

  tips.push('Read the explanations carefully to understand concepts');
  tips.push('Take notes on concepts you find difficult');
  tips.push('Try to complete at least 2-3 practice sessions daily');

  return tips.slice(0, 5);
}
