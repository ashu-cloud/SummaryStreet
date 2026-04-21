import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-text">
        The page you&apos;re looking for does not exist.
      </p>
      <Link href="/" className="btn btn-primary btn-lg">
        Back to Home
      </Link>
    </div>
  )
}
