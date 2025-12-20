import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// POST - Create a comment
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
    const { discussion_id, content, parent_comment_id } = body;

    if (!discussion_id || !content) {
      return NextResponse.json(
        { error: 'Discussion ID and content are required' },
        { status: 400 }
      );
    }

    const { data: comment, error: commentError } = await supabase
      .from('discussion_comments')
      .insert({
        user_id: user.id,
        discussion_id,
        content,
        parent_comment_id: parent_comment_id || null
      })
      .select(`
        *,
        user:users!discussion_comments_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 });

  } catch (error) {
    console.error('Comments POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
