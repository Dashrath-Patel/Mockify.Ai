/**
 * Save Test Results API Route
 * Saves test results for adaptive practice analysis
 * Uses service role to bypass RLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      score, 
      totalQuestions, 
      correctAnswers, 
      timeTaken, 
      analytics 
    } = body;

    if (!userId || !analytics) {
      return NextResponse.json(
        { error: 'userId and analytics are required' },
        { status: 400 }
      );
    }

    // Check if practice_sessions table exists, use it instead of results
    // practice_sessions doesn't require test_id
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        weak_topics: analytics.weaknesses || [],
        questions_count: totalQuestions || 0,
        score: score || 0,
        topic_results: {
          topicWisePerformance: analytics.topicWisePerformance || [],
          strengths: analytics.strengths || [],
          weaknesses: analytics.weaknesses || [],
          correctAnswers: correctAnswers || 0,
          timeTaken: timeTaken || 0
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving to practice_sessions:', error);
      
      // Fallback: Try to insert into a simpler structure
      // First check if we need to create the table
      if (error.code === '42P01') { // Table doesn't exist
        console.log('practice_sessions table not found, creating...');
        return NextResponse.json(
          { error: 'Table not configured. Run the migration first.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      );
    }

    console.log('✅ Test results saved successfully:', data?.id);
    
    return NextResponse.json({
      success: true,
      resultId: data?.id,
      message: 'Results saved for adaptive practice'
    });

  } catch (error) {
    console.error('Error in save-results API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
