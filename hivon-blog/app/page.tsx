'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import SearchBar from '@/components/SearchBar'
import Pagination from '@/components/Pagination'

interface Post {
  id: string
  title: string
  image_url: string | null
  summary: string | null
  created_at: string
  author_id: string
  users: { name: string } | null
}

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Check auth role for smart CTA
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
          setUserRole(data?.role ?? null)
        }
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  const fetchPosts = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '9',
        ...(currentSearch && { search: currentSearch }),
      })
      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json()
      setPosts(data.posts ?? [])
      setTotalPages(data.totalPages ?? 1)
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchPosts(1, search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, fetchPosts])

  useEffect(() => {
    fetchPosts(page, search)
  }, [page])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Smart CTA based on role
  const renderCTA = () => {
    if (!authChecked) return null
    if (userRole === 'author' || userRole === 'admin') {
      return (
        <button
          id="get-started-btn"
          className="btn btn-primary"
          onClick={() => router.push('/posts/new')}
        >
          Write a Story
        </button>
      )
    }
    if (userRole === 'viewer') {
      return (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          You&apos;re signed in as a viewer. New stories from authors will appear here.
        </p>
      )
    }
    // Not logged in
    return (
      <button
        id="get-started-btn"
        className="btn btn-primary"
        onClick={() => router.push('/register')}
      >
        Start Reading for Free
      </button>
    )
  }

  return (
    <div className="container">
      {/* Hero */}
      <div className="page-hero">
        <h1>Stay curious.</h1>
        <p>
          Read thoughtful writing, join the comments, and skim every story with a clear 200-word AI summary.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '2rem' }}>
        <SearchBar value={search} onChange={setSearch} />
        {total > 0 && !loading && (
          <p className="results-count">
            {total} post{total !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
          <span>Loading posts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No posts found</h3>
          <p style={{ marginBottom: '1.25rem' }}>
            {search ? `No results for "${search}"` : 'Be the first to write a post!'}
          </p>
          {!search && renderCTA()}
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
