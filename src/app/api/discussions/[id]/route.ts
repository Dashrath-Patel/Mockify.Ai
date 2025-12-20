import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET - Fetch discussion details with comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get discussion details
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select(`
        *,
        user:users!discussions_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (discussionError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // Update views count
    await supabase
      .from('discussions')
      .update({ views_count: discussion.views_count + 1 })
      .eq('id', id);

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select(`
        *,
        user:users!discussion_comments_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('discussion_id', id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment: any) => {
        const { data: replies } = await supabase
          .from('discussion_comments')
          .select(`
            *,
            user:users!discussion_comments_user_id_fkey (
              id,
              name,
              avatar_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: replies || []
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...discussion,
        comments: commentsWithReplies
      }
    });

  } catch (error) {
    console.error('Discussion detail GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update discussion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, is_resolved } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (is_resolved !== undefined) updates.is_resolved = is_resolved;

    const { data: discussion, error: updateError } = await supabase
      .from('discussions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !discussion) {
      return NextResponse.json(
        { error: 'Failed to update discussion or unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: discussion });

  } catch (error) {
    console.error('Discussion PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete discussion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabase
      .from('discussions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete discussion or unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Discussion DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
