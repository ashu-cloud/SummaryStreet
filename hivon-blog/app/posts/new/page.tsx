'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MAX_CONTENT = 50_000
const WARN_CONTENT = 40_000

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Frontend size guard
    if (content.length > MAX_CONTENT) {
      const words = content.trim().split(/\s+/).length
      setError(`Your blog post is way too big! 😅 It has ${content.length.toLocaleString()} characters (~${words.toLocaleString()} words). Please keep it under ${MAX_CONTENT.toLocaleString()} characters.`)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create post')
        setLoading(false)
        return
      }

      setSuccess('✦ Post published! AI summary and cover image are ready.')
      setTimeout(() => router.push(`/posts/${data.post.id}`), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }


  return (
    <div className="container" style={{ maxWidth: '780px', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="btn btn-secondary btn-sm">← Back</Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: '0.5rem' }}>
          Create New Post
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          AI will generate a summary and choose a matching cover image from Unsplash.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <form id="new-post-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="post-title" className="form-label">Post Title *</label>
            <input
              id="post-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title..."
              required
              maxLength={200}
            />
          </div>

          <div className="alert alert-info">
            Cover image is selected automatically by AI from Unsplash. If no relevant image is found, a default Unsplash cover is used.
          </div>

          <div className="form-group">
            <label htmlFor="post-content" className="form-label">Content *</label>
            <textarea
              id="post-content"
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content here... The AI will generate a ~200-word summary automatically."
              required
              minLength={100}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
              <span style={{
                fontSize: '0.75rem',
                color: content.length > MAX_CONTENT
                  ? 'var(--danger)'
                  : content.length > WARN_CONTENT
                  ? 'var(--warning)'
                  : 'var(--text-muted)'
              }}>
                {content.length.toLocaleString()} / {MAX_CONTENT.toLocaleString()} characters
                {content.length > WARN_CONTENT && content.length <= MAX_CONTENT && ' ⚠️ Getting long'}
                {content.length > MAX_CONTENT && ' 🚫 Too long!'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ~{Math.round(content.trim().split(/\s+/).filter(Boolean).length).toLocaleString()} words
              </span>
            </div>
          </div>

          {loading && (
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }} />
              <span>Publishing and generating AI summary via Groq...</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="publish-post-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Publishing...' : '✦ Publish Post'}
            </button>
            <Link href="/" className="btn btn-secondary btn-lg">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
