import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>
            Tube<span style={{ color: '#ff4444' }}>Intel</span>
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/auth/login" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #2a2a2a', color: '#e8e8e8', textDecoration: 'none', fontSize: 14 }}>
              Sign In
            </Link>
            <Link href="/auth/signup" style={{ padding: '8px 18px', borderRadius: 8, background: '#ff4444', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 100, padding: '4px 14px', fontSize: 13, color: '#ff8888', marginBottom: 28 }}>
          AI-Powered Learning Modules
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
          Turn any YouTube video<br />into a <span style={{ color: '#ff4444' }}>structured lesson</span>
        </h1>
        <p style={{ fontSize: 18, color: '#888', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          Paste a YouTube URL. TubeIntel fetches the transcript, runs it through AI, and produces a complete learning module — objectives, explanations, key terms, examples, and review questions.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{ padding: '13px 32px', borderRadius: 10, background: '#ff4444', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700 }}>
            Start for Free
          </Link>
          <Link href="/auth/login" style={{ padding: '13px 32px', borderRadius: 10, border: '1px solid #2a2a2a', color: '#e8e8e8', textDecoration: 'none', fontSize: 16 }}>
            Sign In
          </Link>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 80, textAlign: 'left' }}>
          {[
            { icon: '🎯', title: 'Learning Objectives', desc: 'Clear goals extracted from the video content' },
            { icon: '📖', title: 'Concept Explanations', desc: 'Taught like a textbook — not just summarised' },
            { icon: '📌', title: 'Key Terms', desc: 'Every term defined exactly as the video explains it' },
            { icon: '💡', title: 'Examples & Analogies', desc: 'Concrete examples that make ideas stick' },
            { icon: '✅', title: 'Key Takeaways', desc: 'The most important ideas at a glance' },
            { icon: '🧠', title: 'Review Questions', desc: 'Test your understanding after watching' },
          ].map(f => (
            <div key={f.title} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 20px' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{f.title}</div>
              <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
