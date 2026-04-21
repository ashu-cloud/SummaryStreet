'use client'

import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'

interface Comment {
  id: string
  comment_text: string
  created_at: string
  user_id: string
  users: { name: string } | null
}

interface CommentSectionProps {
  postId: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      // Lazy import — runs only on client, never during SSR prerender
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await loadComments()
    }
    init()
  }, [postId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments/${postId}`)
      const data = await res.json()
      setComments(data.comments ?? [])
    } catch {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/comments/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to post comment')
      } else {
        setComments(prev => [...prev, data.comment])
        setText('')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments-section" aria-label="Comments section">
      <h2 className="comments-title">
        💬 Comments ({comments.length})
      </h2>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit} id="comment-form">
          <label htmlFor="comment-input" className="form-label">Add a Comment</label>
          <textarea
            id="comment-input"
            className="form-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            style={{ resize: 'vertical', minHeight: '80px' }}
            required
          />
          {error && <div className="alert alert-error">{error}</div>}
          <button
            id="submit-comment-btn"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !text.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <a href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Sign in
          </a>{' '}
          to join the conversation.
        </div>
      )}

      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="empty-state-icon">💭</div>
          <h3>No comments yet</h3>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item animate-fade-in">
              <div className="comment-header">
                <span className="comment-author">{comment.users?.name ?? 'Anonymous'}</span>
                <span className="comment-date">{formatDate(comment.created_at)}</span>
              </div>
              <p className="comment-text">{comment.comment_text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
