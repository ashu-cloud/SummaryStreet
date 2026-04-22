'use client'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  )

  return (
    <div className="pagination" role="navigation" aria-label="Post pagination">
      <button
        id="pagination-prev"
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {visiblePages.map((p, idx) => {
        const prevPage = visiblePages[idx - 1]
        const showEllipsis = prevPage && p - prevPage > 1

        return (
          <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {showEllipsis && (
              <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>
            )}
            <button
              id={`pagination-page-${p}`}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        )
      })}

      <button
        id="pagination-next"
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  )
}
