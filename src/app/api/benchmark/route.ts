import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('testId');
    const examType = searchParams.get('examType');
    const topic = searchParams.get('topic');

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Get user's result for this test
    const { data: userResult, error: userResultError } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (userResultError || !userResult) {
      return NextResponse.json(
        { error: 'No result found for this test' },
        { status: 404 }
      );
    }

    // Get benchmark data
    const { data: benchmark, error: benchmarkError } = await supabase
      .from('benchmarks')
      .select('*')
      .eq('test_id', testId)
      .single();

    if (benchmarkError) {
      console.error('Error fetching benchmark:', benchmarkError);
    }

    // Get all results for this test to calculate percentile
    const { data: allResults, error: allResultsError } = await supabase
      .from('test_results')
      .select('score, user_id')
      .eq('test_id', testId)
      .order('score', { ascending: false });

    if (allResultsError) {
      console.error('Error fetching all results:', allResultsError);
    }

    // Calculate user's percentile
    let percentile = 0;
    let rank = 0;
    
    if (allResults && allResults.length > 0) {
      const userScore = Number(userResult.score);
      const scoresBelowUser = allResults.filter((r: any) => Number(r.score) < userScore).length;
      percentile = (scoresBelowUser / allResults.length) * 100;
      
      // Find rank
      rank = allResults.findIndex((r: any) => r.user_id === user.id) + 1;
    }

    // Calculate score distribution
    const scoreDistribution = calculateScoreDistribution(allResults || []);

    // Get similar topic benchmarks if available
    let topicBenchmarks = [];
    if (examType && topic) {
      const { data: topicBenchmarkData } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('exam_type', examType)
        .eq('topic', topic)
        .order('average_score', { ascending: false })
        .limit(10);

      topicBenchmarks = topicBenchmarkData || [];
    }

    const comparison = {
      user_score: Number(userResult.score),
      average_score: benchmark ? Number(benchmark.average_score) : 0,
      median_score: benchmark ? Number(benchmark.median_score) : 0,
      highest_score: benchmark ? Number(benchmark.highest_score) : Number(userResult.score),
      percentile: Number(percentile.toFixed(2)),
      rank,
      total_participants: allResults?.length || 0,
      score_distribution: scoreDistribution,
      time_comparison: {
        user_time: userResult.time_taken,
        average_time: benchmark ? benchmark.average_time : userResult.time_taken
      },
      topic_benchmarks: topicBenchmarks.map((b: any) => ({
        topic: b.topic,
        average_score: Number(b.average_score),
        total_attempts: b.total_attempts
      }))
    };

    return NextResponse.json({ success: true, data: comparison });

  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateScoreDistribution(results: any[]) {
  if (results.length === 0) return [];

  const ranges = [
    { range: '0-20', min: 0, max: 20 },
    { range: '21-40', min: 21, max: 40 },
    { range: '41-60', min: 41, max: 60 },
    { range: '61-80', min: 61, max: 80 },
    { range: '81-100', min: 81, max: 100 }
  ];

  return ranges.map(({ range, min, max }) => ({
    range,
    count: results.filter((r: any) => {
      const score = Number(r.score);
      return score >= min && score <= max;
    }).length
  }));
}

export const dynamic = 'force-dynamic';
