import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>
            Tube<span style={{ color: '#ff4444' }}>Intel</span>
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {user ? (
              <Link href="/dashboard" style={{ padding: '8px 18px', borderRadius: 8, background: '#ff4444', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #2a2a2a', color: '#e8e8e8', textDecoration: 'none', fontSize: 14 }}>
                  Sign In
                </Link>
                <Link href="/auth/signup" style={{ padding: '8px 18px', borderRadius: 8, background: '#ff4444', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 100, padding: '4px 14px', fontSize: 12, color: '#ff8888', marginBottom: 24, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
            AI-Powered Learning
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
            Turn any YouTube video into a{' '}
            <span style={{ color: '#ff4444' }}>structured lesson</span>
          </h1>
          <p style={{ fontSize: 17, color: '#888', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 440 }}>
            Paste a URL. TubeIntel fetches the transcript, runs it through AI, and delivers a complete learning module in under a minute.
          </p>
          <Link href="/auth/signup" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: '#ff4444', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '0.01em' }}>
            Get Started Free
          </Link>
        </div>

        {/* Module card mockup */}
        <ModuleMockup />
      </section>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #2a2a2a', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 48 }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { n: '01', icon: '📋', title: 'Paste a YouTube URL', desc: 'Drop any YouTube link into the input field. No browser extension or install required.' },
              { n: '02', icon: '⚡', title: 'AI builds your module', desc: 'TubeIntel fetches the transcript and generates objectives, notes, key terms, and examples.' },
              { n: '03', icon: '📚', title: 'Saved to your dashboard', desc: 'Every module is stored in your personal library. Search, revisit, and review any time.' },
            ].map(step => (
              <div key={step.n} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '28px 24px' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#ff4444', marginBottom: 16, lineHeight: 1 }}>{step.n}</div>
                <div style={{ fontSize: 22, marginBottom: 12 }}>{step.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#e8e8e8' }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #2a2a2a', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 48 }}>
            Everything you need
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { icon: '🤖', title: 'AI-powered summaries', desc: 'Gemini distills hours of content into structured, scannable notes.' },
              { icon: '🗂️', title: 'Personal learning dashboard', desc: 'All your modules saved and organised in one place.' },
              { icon: '🎥', title: 'Any YouTube video', desc: 'Lectures, tutorials, talks — if there\'s a transcript, TubeIntel handles it.' },
              { icon: '🔖', title: 'Save and revisit anytime', desc: 'Modules persist permanently. Pick up where you left off.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '24px' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#e8e8e8' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #2a2a2a', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Start learning smarter today
        </h2>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 36px' }}>
          Free to use. No credit card required.
        </p>
        <Link href="/auth/signup" style={{ display: 'inline-block', padding: '13px 36px', borderRadius: 10, background: '#ff4444', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '0.01em' }}>
          Sign Up Free
        </Link>
      </section>

    </div>
  )
}

function ModuleMockup() {
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,68,68,0.15)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 0 0 1px #2a2a2a, 0 24px 48px rgba(0,0,0,0.4)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444', opacity: 0.7 }} />
        <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>TubeIntel Module</span>
      </div>

      {/* Video title */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.4, marginBottom: 10 }}>
        The Feynman Technique: Learn Anything Fast
      </div>

      {/* Overview snippet */}
      <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        Richard Feynman's approach to learning involves explaining concepts in simple terms to identify gaps. This module covers the four-step method, common pitfalls, and how to apply it across subjects.
      </div>

      {/* Section pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['📌 Key Terms', '💡 Example', '✅ Takeaways'].map(pill => (
          <span key={pill} style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#888' }}>{pill}</span>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ borderTop: '1px solid #222', paddingTop: 12, display: 'flex', gap: 16 }}>
        <span style={{ fontSize: 11, color: '#555' }}>4 sections</span>
        <span style={{ fontSize: 11, color: '#555' }}>12 key terms</span>
        <span style={{ fontSize: 11, color: '#555' }}>5 review questions</span>
      </div>
    </div>
  )
}
