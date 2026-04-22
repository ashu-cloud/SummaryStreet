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
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | undefined

    // Lazily import Supabase client only on the client side
    const initAuth = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', user.id)
          .single()
        if (!isMounted) return
        setProfile(data)
      } else {
        setProfile(null)
      }

      if (!isMounted) return
      setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!isMounted) return
          setUser(session?.user ?? null)
          if (session?.user) {
            const { data } = await supabase
              .from('users')
              .select('name, role')
              .eq('id', session.user.id)
              .single()
            if (!isMounted) return
            setProfile(data)
          } else {
            setProfile(null)
          }
        }
      )

      unsubscribe = () => subscription.unsubscribe()
    }

    initAuth()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    // If network/global revoke fails, clear local session so user is still logged out.
    if (error) {
      console.error('Sign out error, retrying local sign out:', error.message)
      await supabase.auth.signOut({ scope: 'local' })
    }

    setUser(null)
    setProfile(null)
    setSigningOut(false)
    router.replace('/login')
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
          SummaryStreet
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
                    disabled={signingOut}
                  >
                    {signingOut ? 'Signing Out...' : 'Sign Out'}
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
