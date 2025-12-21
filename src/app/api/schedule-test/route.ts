import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      testId, 
      scheduledDate, 
      scheduledTime, 
      timezone = 'UTC',
      sendDayBeforeReminder = true,
      sendHourBeforeReminder = true,
      notes 
    } = body;

    // Validate required fields
    if (!testId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Test ID, scheduled date, and time are required' },
        { status: 400 }
      );
    }

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    // Schedule the test
    const { data: scheduledTest, error: scheduleError } = await supabase
      .from('scheduled_tests')
      .insert({
        user_id: user.id,
        test_id: testId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        timezone: timezone,
        send_day_before_reminder: sendDayBeforeReminder,
        send_hour_before_reminder: sendHourBeforeReminder,
        reminder_email: userData?.email || user.email,
        notes: notes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('Error scheduling test:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to schedule test' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduledTest: scheduledTest
    });

  } catch (error) {
    console.error('Error in schedule-test API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get scheduled tests for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'scheduled';

    // Get scheduled tests with test details
    const { data: scheduledTests, error } = await supabase
      .from('scheduled_tests')
      .select(`
        *,
        mock_tests (
          id,
          title,
          total_questions,
          time_limit,
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .eq('status', status)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled tests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled tests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduledTests: scheduledTests || []
    });

  } catch (error) {
    console.error('Error in schedule-test GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
