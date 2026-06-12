'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { VideoRecommendation } from '@/types'

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`
  return `${n} views`
}

export default function DiscoverPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [results, setResults] = useState<VideoRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [summarizeError, setSummarizeError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setSummarizeError('')
    setSearched(false)
    try {
      const res = await fetch(`/api/recommend?topic=${encodeURIComponent(topic.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setResults([])
      } else {
        setResults(data)
        setSearched(true)
      }
    } catch {
      setError('Network error — could not reach the backend.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSummarize(video: VideoRecommendation) {
    setSummarizing(video.video_id)
    setSummarizeError('')
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.video_id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSummarizeError(data.error ?? `Error ${res.status}`)
        setSummarizing(null)
        return
      }
      router.push(`/modules/${data.id}`)
    } catch {
      setSummarizeError('Network error — could not reach the backend.')
      setSummarizing(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Tube<span style={{ color: '#ff4444' }}>Intel</span></span>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Discover Videos</h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            Search any topic to find educational YouTube videos. Click "Summarize" to instantly build a learning module.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. machine learning, stoicism, system design…"
            disabled={loading}
            style={{
              flex: 1,
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 15,
              color: '#e8e8e8',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            style={{
              background: loading || !topic.trim() ? '#333' : '#ff4444',
              color: loading || !topic.trim() ? '#888' : '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && (
          <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff8888', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {summarizeError && (
          <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff8888', fontSize: 13, marginBottom: 24 }}>
            {summarizeError}
            {summarizeError.includes('API key') && (
              <span> <Link href="/settings/keys" style={{ color: '#ff8888', fontWeight: 600 }}>Configure your API keys →</Link></span>
            )}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #2a2a2a', borderTopColor: '#ff4444', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: '#888', fontSize: 14 }}>Finding videos…</div>
            </div>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No videos found</div>
            <div style={{ color: '#888', fontSize: 14 }}>Try a different topic or more specific search term.</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {results.map(video => {
              const isSummarizing = summarizing === video.video_id
              const isBlocked = summarizing !== null && !isSummarizing
              return (
                <div
                  key={video.video_id}
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  <a href={video.youtube_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', flexShrink: 0 }}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{
                        position: 'absolute', bottom: 8, right: 8,
                        background: 'rgba(0,0,0,0.8)', color: '#e8e8e8',
                        fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      }}>
                        {video.duration_formatted}
                      </span>
                    </div>
                  </a>

                  <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 6,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      color: '#e8e8e8',
                    }}>
                      {video.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{video.channel_name}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, background: '#222', border: '1px solid #2a2a2a', borderRadius: 4, padding: '2px 7px', color: '#888' }}>
                        {formatViewCount(video.view_count)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSummarize(video)}
                      disabled={isSummarizing || isBlocked}
                      style={{
                        marginTop: 'auto',
                        background: isSummarizing ? '#333' : isBlocked ? '#222' : '#ff4444',
                        color: isSummarizing || isBlocked ? '#888' : '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 0',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isSummarizing || isBlocked ? 'not-allowed' : 'pointer',
                        width: '100%',
                      }}
                    >
                      {isSummarizing ? 'Summarizing…' : 'Summarize →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
