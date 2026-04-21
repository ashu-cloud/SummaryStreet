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
    <Link href={`/posts/${post.id}`} className="post-card-link">
      <article className="post-card animate-fade-in">
        <div className="post-card-content">
          <p className="post-card-kicker">
            <span className="post-card-author">{authorName}</span>
            <span aria-hidden="true"> {' '}·{' '} </span>
            <span>{formatDate(post.created_at)}</span>
          </p>

          <h2 className="post-card-title">{post.title}</h2>

          {post.summary && (
            <p className="post-card-summary">{post.summary}</p>
          )}

          <div className="post-card-meta">
            <span className="post-card-readtime">200-word AI brief</span>
            {post.summary && (
              <span className="ai-badge">
                AI Summary
              </span>
            )}
          </div>
        </div>

        {showImage && (
          <div className="post-card-media" aria-hidden="true">
            <img
              src={post.image_url!}
              alt={post.title}
              className="post-card-image"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        )}
      </article>
    </Link>
  )
}
