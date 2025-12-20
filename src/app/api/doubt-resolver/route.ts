/**
 * Doubt Resolver API Route
 * POST /api/doubt-resolver
 * Handles student doubt resolution requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveDoubt, saveDoubtInteraction } from '@/lib/agents/doubt-resolver-agent';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DoubtRequestBody {
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  doubtText: string;
  topic?: string;
  questionIndex?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DoubtRequestBody = await request.json();

    // Validate required fields
    if (!body.questionText || !body.options || !body.correctAnswer || !body.doubtText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate options array
    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        { error: 'Invalid options format' },
        { status: 400 }
      );
    }

    // Rate limiting check (simple version)
    const { data: recentDoubts, error: rateLimitError } = await supabase
      .from('doubt_history')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute

    if (!rateLimitError && recentDoubts && recentDoubts.length >= 5) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment before asking another doubt.',
          retryAfter: 60 
        },
        { status: 429 }
      );
    }

    console.log(`🤔 Resolving doubt for user ${user.id}: "${body.doubtText.substring(0, 50)}..."`);

    // Call doubt resolver agent
    const result = await resolveDoubt({
      questionText: body.questionText,
      options: body.options,
      correctAnswer: body.correctAnswer,
      userAnswer: body.userAnswer || 'Not answered',
      doubtText: body.doubtText,
      userId: user.id,
      topic: body.topic
    });

    // Save interaction asynchronously (don't wait)
    saveDoubtInteraction(
      user.id,
      body.questionText,
      body.doubtText
    ).catch(err => console.error('Failed to save doubt interaction:', err));

    console.log(`✅ Doubt resolved with ${result.confidence} confidence`);

    return NextResponse.json({
      success: true,
      explanation: result.explanation,
      materialReferences: result.materialReferences,
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in doubt resolver API:', error);
    
    // Determine error type and message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for doubt history (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get recent doubt history
    const { data: history, error } = await supabase
      .from('doubt_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      history: history || []
    });

  } catch (error) {
    console.error('Error fetching doubt history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doubt history' },
      { status: 500 }
    );
  }
}
