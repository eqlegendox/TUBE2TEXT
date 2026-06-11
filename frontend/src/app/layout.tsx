import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TubeIntel — YouTube Learning Modules',
  description: 'Turn any YouTube video into a structured AI-powered learning module.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
