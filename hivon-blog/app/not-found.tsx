import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #050a14)',
      color: 'var(--text-primary, #f0f4ff)',
      fontFamily: 'Inter, sans-serif',
      gap: '1.5rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem' }}>404</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Page Not Found</h1>
      <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 2rem',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Back to Home
      </Link>
    </div>
  )
}
