'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  name: string
  role: 'author' | 'viewer' | 'admin'
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lazily import Supabase client only on the client side
    const initAuth = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          if (session?.user) {
            const { data } = await supabase
              .from('users')
              .select('name, role')
              .eq('id', session.user.id)
              .single()
            setProfile(data)
          } else {
            setProfile(null)
          }
        }
      )

      return () => subscription.unsubscribe()
    }

    initAuth()
  }, [])

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path ? 'nav-link active' : 'nav-link'

  const roleBadgeClass = profile?.role
    ? `nav-badge badge-${profile.role}`
    : ''

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          ✦ SummaryStreet
        </Link>

        <div className="navbar-links">
          <Link href="/" className={isActive('/')}>
            <span>Home</span>
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  {profile?.role === 'admin' && (
                    <Link href="/dashboard" className={isActive('/dashboard')}>
                      <span>Dashboard</span>
                    </Link>
                  )}
                  {(profile?.role === 'author' || profile?.role === 'admin') && (
                    <Link href="/posts/new" className={isActive('/posts/new')}>
                      <span>New Post</span>
                    </Link>
                  )}
                  {profile?.role === 'author' && (
                    <Link href="/dashboard" className={isActive('/dashboard')}>
                      <span>My Posts</span>
                    </Link>
                  )}
                  <span className={roleBadgeClass}>{profile?.role}</span>
                  <button
                    id="sign-out-btn"
                    onClick={handleSignOut}
                    className="btn btn-secondary btn-sm"
                    style={{ marginLeft: '0.25rem' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={isActive('/login')}>
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
