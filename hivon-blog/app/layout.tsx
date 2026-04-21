import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: {
    default: 'SummaryStreet - AI-Powered Blogging Platform',
    template: '%s | SummaryStreet',
  },
  description: 'A modern blogging platform with AI-generated summaries powered by Groq and Supabase.',
  keywords: ['blog', 'AI', 'Groq', 'Supabase', 'Next.js'],
  authors: [{ name: 'SummaryStreet Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Navbar />
        <main className="page-wrapper">
          {children}
        </main>
      </body>
    </html>
  )
}
