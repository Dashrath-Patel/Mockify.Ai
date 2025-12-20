import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET - Fetch discussions
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

    const searchParams = request.nextUrl.searchParams;
    const examType = searchParams.get('examType');
    const topic = searchParams.get('topic');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('discussions')
      .select(`
        *,
        user:users!discussions_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (examType) {
      query = query.eq('exam_type', examType);
    }

    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data: discussions, error: discussionsError } = await query;

    if (discussionsError) {
      console.error('Error fetching discussions:', discussionsError);
      return NextResponse.json(
        { error: 'Failed to fetch discussions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: discussions });

  } catch (error) {
    console.error('Discussions GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new discussion
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, exam_type, topic, tags } = body;

    if (!title || !content || !exam_type) {
      return NextResponse.json(
        { error: 'Title, content, and exam type are required' },
        { status: 400 }
      );
    }

    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .insert({
        user_id: user.id,
        title,
        content,
        exam_type,
        topic: topic || null,
        tags: tags || []
      })
      .select(`
        *,
        user:users!discussions_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (discussionError) {
      console.error('Error creating discussion:', discussionError);
      return NextResponse.json(
        { error: 'Failed to create discussion' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: discussion }, { status: 201 });

  } catch (error) {
    console.error('Discussions POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
