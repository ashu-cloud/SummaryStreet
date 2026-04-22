import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getAuthorName(users: unknown): string {
  if (Array.isArray(users)) {
    const first = users[0] as { name?: string } | undefined
    return first?.name ?? 'Unknown'
  }

  if (users && typeof users === 'object' && 'name' in users) {
    return (users as { name?: string }).name ?? 'Unknown'
  }

  return 'Unknown'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  // Fetch posts — admin sees all, author sees own
  let postsQuery = supabase
    .from('posts')
    .select('id, title, created_at, summary, users!posts_author_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (profile.role === 'author') {
    postsQuery = postsQuery.eq('author_id', user.id)
  }

  const { data: posts, count } = await postsQuery

  // Fetch total comments count
  const { count: commentCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
            {profile.role === 'admin' ? '⚡ Admin Dashboard' : '📝 My Posts'}
          </h1>
          <span className={`nav-badge badge-${profile.role}`}>{profile.role}</span>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{profile.name}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{count ?? 0}</div>
          <div className="stat-label">{profile.role === 'admin' ? 'Total Posts' : 'My Posts'}</div>
        </div>
        {profile.role === 'admin' && (
          <div className="stat-card">
            <div className="stat-number">{commentCount ?? 0}</div>
            <div className="stat-label">Total Comments</div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-number">
            {posts?.filter(p => p.summary).length ?? 0}
          </div>
          <div className="stat-label">AI Summaries</div>
        </div>
      </div>

      {/* Posts table */}
      <div className="section-header">
        <h2 className="section-title">
          {profile.role === 'admin' ? 'All Posts' : 'My Posts'}
        </h2>
        {(profile.role === 'author' || profile.role === 'admin') && (
          <Link href="/posts/new" className="btn btn-primary" id="dashboard-new-post-btn">
            + New Post
          </Link>
        )}
      </div>

      {!posts || posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No posts yet</h3>
          <p>Create your first post to get started</p>
          <Link href="/posts/new" className="btn btn-primary">Write a Post</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" id="posts-table">
            <thead>
              <tr>
                <th>Title</th>
                {profile.role === 'admin' && <th>Author</th>}
                <th>AI Summary</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link
                      href={`/posts/${post.id}`}
                      style={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {post.title.length > 60 ? post.title.slice(0, 60) + '…' : post.title}
                    </Link>
                  </td>
                  {profile.role === 'admin' && (
                    <td>
                      {getAuthorName(post.users)}
                    </td>
                  )}
                  <td>
                    {post.summary ? (
                      <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                        ✦ Generated
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>{formatDate(post.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/posts/${post.id}`}
                        className="btn btn-secondary btn-sm"
                        id={`view-post-${post.id}`}
                      >
                        View
                      </Link>
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        id={`edit-post-${post.id}`}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
