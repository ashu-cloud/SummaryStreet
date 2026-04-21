'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadPost = async () => {
      const res = await fetch(`/api/posts/${id}`)
      const data = await res.json()
      if (res.ok && data.post) {
        setTitle(data.post.title)
        setContent(data.post.body)
        setImageUrl(data.post.image_url ?? '')
      } else {
        setError('Post not found')
      }
      setFetching(false)
    }
    loadPost()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, image_url: imageUrl || null }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Update failed')
      setLoading(false)
    } else {
      setSuccess('Post updated successfully!')
      setTimeout(() => router.push(`/posts/${id}`), 1200)
    }
  }

  if (fetching) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>Loading post...</span>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '780px', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/posts/${id}`} className="btn btn-secondary btn-sm">← Back to Post</Link>
      </div>

      <h1 style={{ marginBottom: '2rem', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
        Edit Post
      </h1>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <form id="edit-post-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="edit-post-title" className="form-label">Title *</label>
            <input
              id="edit-post-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-post-image" className="form-label">Featured Image URL</label>
            <input
              id="edit-post-image"
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg (optional)"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                style={{ marginTop: '0.75rem', maxHeight: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', width: '100%' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-post-content" className="form-label">Content *</label>
            <textarea
              id="edit-post-content"
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="save-post-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
            <Link href={`/posts/${id}`} className="btn btn-secondary btn-lg">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
