import { createClient } from '@/lib/supabase/server'
import { generateCoverImageUrl } from '@/lib/groq'
import { normalizePostImageUrl } from '@/lib/images'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts/[id] — single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*, users!posts_author_id_fkey(id, name, role)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json({
    post: {
      ...data,
      image_url: normalizePostImageUrl(data.image_url, data.title) ?? data.image_url,
    },
  })
}

// PATCH /api/posts/[id] — edit post (Author owns it OR Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, title, body')
    .eq('id', id)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const isOwner = post.author_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { title?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, content } = body
  const nextTitle = typeof title === 'string' ? title.trim() : undefined
  const nextContent = typeof content === 'string' ? content.trim() : undefined

  if (title !== undefined && !nextTitle) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  if (content !== undefined && !nextContent) {
    return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 })
  }

  if (nextTitle === undefined && nextContent === undefined) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
  }

  const finalTitle = nextTitle ?? post.title
  const finalBody = nextContent ?? post.body
  const coverImage = await generateCoverImageUrl(finalTitle, finalBody)

  const { data: updated, error: updateError } = await supabase
    .from('posts')
    .update({
      ...(nextTitle !== undefined && { title: nextTitle }),
      ...(nextContent !== undefined && { body: nextContent }),
      image_url: coverImage.imageUrl,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ post: updated })
}

// DELETE /api/posts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const isOwner = post.author_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Post deleted successfully' })
}
