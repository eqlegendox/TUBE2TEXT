'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function parseVideoId(input: string): string | null {
  const trimmed = input.trim()
  // Already a bare video ID (11 chars, no slashes)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v')
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0]
  } catch {
    // not a URL
  }
  return null
}

export default function SummarizePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const videoId = parseVideoId(input)
    if (!videoId) {
      setError('Could not parse a YouTube video ID from that URL. Try pasting the full URL like: https://youtube.com/watch?v=VIDEO_ID')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setLoading(false)
        return
      }
      router.push(`/modules/${data.id}`)
    } catch {
      setError('Network error — is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Tube<span style={{ color: '#ff4444' }}>Intel</span></span>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Generate Learning Module</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
          Paste a YouTube URL. The AI will fetch the transcript and produce a full structured lesson — objectives, explanations, key terms, examples, and review questions.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 8 }}>
              YouTube URL or Video ID
            </label>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              disabled={loading}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#e8e8e8', outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff8888', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              {error}
              {error.includes('API key') && (
                <span> <Link href="/settings/keys" style={{ color: '#ff8888', fontWeight: 600 }}>Configure your API keys →</Link></span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              width: '100%',
              background: loading ? '#333' : '#ff4444',
              color: loading ? '#888' : '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '13px',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating…' : 'Generate Learning Module'}
          </button>
        </form>

        {loading && (
          <div style={{ marginTop: 32, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2a2a2a', borderTopColor: '#ff4444', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Analyzing video…</div>
            <div style={{ color: '#888', fontSize: 13 }}>Fetching transcript + generating module with AI. This takes 20–60 seconds.</div>
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
