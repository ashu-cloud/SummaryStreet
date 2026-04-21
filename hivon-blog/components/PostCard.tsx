'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Post {
  id: string
  title: string
  image_url: string | null
  summary: string | null
  created_at: string
  author_id: string
  users?: { name: string } | null
}

interface PostCardProps {
  post: Post
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function PostCard({ post }: PostCardProps) {
  const authorName = post.users?.name ?? 'Unknown'
  const [imgError, setImgError] = useState(false)

  const showImage = post.image_url && !imgError

  return (
    <Link href={`/posts/${post.id}`} style={{ display: 'block' }}>
      <article className="post-card animate-fade-in">
        {showImage ? (
          <img
            src={post.image_url!}
            alt={post.title}
            className="post-card-image"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="post-card-image-placeholder" aria-hidden="true">
            📝
          </div>
        )}

        <div className="post-card-body">
          <h2 className="post-card-title">{post.title}</h2>

          {post.summary && (
            <p className="post-card-summary">{post.summary}</p>
          )}

          <div className="post-card-meta">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="post-card-author">by {authorName}</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            {post.summary && (
              <span className="ai-badge">
                ✦ AI Summary
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
