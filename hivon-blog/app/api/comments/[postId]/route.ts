import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/comments/[postId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, users!comments_user_id_fkey(name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: data })
}

// POST /api/comments/[postId]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { comment_text } = body

  if (!comment_text?.trim()) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
  }

  const { data: comment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      comment_text: comment_text.trim(),
    })
    .select('*, users!comments_user_id_fkey(name)')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ comment }, { status: 201 })
}
