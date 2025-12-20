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
    const examType = searchParams.get('examType');
    const topic = searchParams.get('topic');

    // Build query
    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);

    if (examType) {
      query = query.eq('exam_type', examType);
    }

    if (topic) {
      query = query.eq('topic', topic);
    }

    query = query.order('last_attempted', { ascending: false });

    const { data: progressData, error: progressError } = await query;

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress data' },
        { status: 500 }
      );
    }

    // Get overall statistics
    const { data: resultsData, error: resultsError } = await supabase
      .from('test_results')
      .select('score, total_questions, correct_answers, time_taken, completed_at, test_id')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
    }

    // Calculate overall stats
    const totalTests = resultsData?.length || 0;
    const averageScore = totalTests > 0
      ? resultsData!.reduce((sum: number, r: any) => sum + Number(r.score), 0) / totalTests
      : 0;
    const totalTimeSpent = resultsData?.reduce((sum: number, r: any) => sum + r.time_taken, 0) || 0;
    const averageAccuracy = totalTests > 0
      ? (resultsData!.reduce((sum: number, r: any) => sum + (r.correct_answers / r.total_questions * 100), 0) / totalTests)
      : 0;

    // Get recent performance (last 10 tests)
    const recentPerformance = resultsData?.slice(0, 10).map((r: any) => ({
      date: r.completed_at,
      score: Number(r.score),
      test_id: r.test_id
    })) || [];

    // Calculate improvement trend (group by week)
    const improvementTrend = calculateImprovementTrend(resultsData || []);

    // Get topic-wise performance
    const topicWisePerformance = progressData?.map((p: any) => ({
      topic: p.topic,
      tests_attempted: p.tests_attempted,
      average_score: Number(p.average_score),
      accuracy: Number(p.accuracy_rate),
      highest_score: Number(p.highest_score)
    })) || [];

    // Determine strength and weakness
    const sortedByScore = [...topicWisePerformance].sort((a, b) => b.average_score - a.average_score);
    const strongTopics = sortedByScore.slice(0, 3).map(t => t.topic);
    const weakTopics = sortedByScore.slice(-3).reverse().map(t => t.topic);

    const analytics = {
      overall_progress: {
        total_tests: totalTests,
        average_score: Number(averageScore.toFixed(2)),
        total_time_spent: totalTimeSpent,
        accuracy: Number(averageAccuracy.toFixed(2))
      },
      topic_wise_performance: topicWisePerformance,
      strength_weakness: {
        strong_topics: strongTopics,
        weak_topics: weakTopics
      },
      recent_performance: recentPerformance,
      improvement_trend: improvementTrend,
      raw_progress: progressData
    };

    return NextResponse.json({ success: true, data: analytics });

  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateImprovementTrend(results: any[]) {
  if (results.length === 0) return [];

  // Group by week
  const weeklyData: Record<string, { scores: number[], count: number }> = {};

  results.forEach(r => {
    const date = new Date(r.completed_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { scores: [], count: 0 };
    }

    weeklyData[weekKey].scores.push(Number(r.score));
    weeklyData[weekKey].count++;
  });

  // Calculate average for each week
  const trend = Object.entries(weeklyData)
    .map(([date, data]) => ({
      date,
      average_score: Number((data.scores.reduce((a, b) => a + b, 0) / data.count).toFixed(2)),
      tests_count: data.count
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return trend;
}

export const dynamic = 'force-dynamic';
