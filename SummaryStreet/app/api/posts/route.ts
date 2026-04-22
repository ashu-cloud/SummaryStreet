import { createClient } from '@/lib/supabase/server'
import { generateCoverImageUrl, generateSummary } from '@/lib/groq'
import { normalizePostImageUrl } from '@/lib/images'
import { NextRequest, NextResponse } from 'next/server'

const MAX_TITLE_LENGTH = 200
const MAX_CONTENT_LENGTH = 50_000   // ~10,000 words — very generous
const MAX_CONTENT_WORDS = 10_000

// GET /api/posts — list posts with search + pagination
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '9')
  const search = searchParams.get('search') ?? ''
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('posts')
    .select('id, title, image_url, summary, created_at, author_id, users!posts_author_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const normalizedPosts = (data ?? []).map((post) => ({
    ...post,
    image_url: normalizePostImageUrl(post.image_url, post.title) ?? post.image_url,
  }))

  return NextResponse.json({
    posts: normalizedPosts,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

// POST /api/posts — create a new post (Author/Admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ── Auth check ──────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to create a post. Please log in and try again.' },
      { status: 401 }
    )
  }

  // ── Role check ──────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['author', 'admin'].includes(profile.role)) {
    return NextResponse.json(
      { error: 'Only Authors and Admins can publish posts. Your account role is: ' + (profile?.role ?? 'unknown') },
      { status: 403 }
    )
  }

  // ── Parse body safely ───────────────────────────────────────────────────────
  let body: { title?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request — could not parse the post data. Please try again.' },
      { status: 400 }
    )
  }

  const { title, content } = body

  // ── Field validation ────────────────────────────────────────────────────────
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Your title is too long (${title.length} characters). Maximum allowed is ${MAX_TITLE_LENGTH} characters.` },
      { status: 400 }
    )
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    const wordCount = content.trim().split(/\s+/).length
    return NextResponse.json(
      {
        error: `Your blog post is way too big! 😅 It has ${content.length.toLocaleString()} characters (~${wordCount.toLocaleString()} words). Please keep it under ${MAX_CONTENT_LENGTH.toLocaleString()} characters (about ${MAX_CONTENT_WORDS.toLocaleString()} words).`
      },
      { status: 413 }
    )
  }

  // ── Generate AI summary via Groq ────────────────────────────────────────────
  let summary = ''
  try {
    summary = await generateSummary(title, content)
  } catch (groqError) {
    console.error('Groq summary generation failed:', groqError)
    // Graceful fallback — don't block post creation if AI fails
    summary = content.substring(0, 250).trim() + '...'
  }

  // ── Generate cover image URL via AI + Unsplash ─────────────────────────────
  const coverImage = await generateCoverImageUrl(title, content)

  // ── Insert post ─────────────────────────────────────────────────────────────
  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({
      title: title.trim(),
      body: content.trim(),
      image_url: coverImage.imageUrl,
      author_id: user.id,
      summary,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: `Failed to save post: ${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({ post }, { status: 201 })
}
