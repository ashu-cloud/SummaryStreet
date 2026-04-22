import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import CommentSection from '@/components/CommentSection'
import { normalizePostImageUrl } from '@/lib/images'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('title, summary')
    .eq('id', id)
    .single()

  return {
    title: data?.title ?? 'Post',
    description: data?.summary ?? undefined,
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let userProfile = null

  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    userProfile = data
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, users!posts_author_id_fkey(id, name, role)')
    .eq('id', id)
    .single()

  if (error || !post) notFound()

  const canEdit =
    user?.id === post.author_id || userProfile?.role === 'admin'
  const displayImageUrl = normalizePostImageUrl(post.image_url, post.title)

  return (
    <div className="post-detail animate-fade-in">
      {/* Back nav */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" className="btn btn-secondary btn-sm">← Back to Posts</Link>
      </div>

      {/* Title */}
      <h1 className="post-detail-title">{post.title}</h1>

      {/* Meta bar */}
      <div className="post-meta-bar">
        <span>
          By{' '}
          <span className="post-meta-author">
            {post.users?.name ?? 'Unknown'}
          </span>
        </span>
        <span>📅 {formatDate(post.created_at)}</span>
        <span className="nav-badge badge-viewer">{post.users?.role}</span>
        {canEdit && (
          <Link
            href={`/posts/${id}/edit`}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto' }}
            id="edit-post-btn"
          >
            ✏️ Edit Post
          </Link>
        )}
      </div>

      {/* Featured Image */}
      {displayImageUrl && (
        <img
          src={displayImageUrl}
          alt={post.title}
          className="post-detail-image"
        />
      )}

      {/* AI Summary */}
      {post.summary && (
        <div className="ai-summary-box">
          <div className="ai-summary-header">
            <span>✦</span>
            <span>AI-Generated Summary</span>
          </div>
          <p className="ai-summary-text">{post.summary}</p>
        </div>
      )}

      {/* Post body */}
      <div className="post-body">
        {post.body.split('\n\n').map((paragraph: string, idx: number) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      {/* Comments */}
      <CommentSection postId={id} />
    </div>
  )
}
