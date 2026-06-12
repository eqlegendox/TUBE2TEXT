import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { SavedModule } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: modules } = await supabase
    .from('modules')
    .select('id, video_id, video_title, notion_page_url, truncated, created_at, summary')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const hasModules = modules && modules.length > 0
  const totalSections = hasModules
    ? (modules as SavedModule[]).reduce((sum, m) => sum + (m.summary?.sections?.length ?? 0), 0)
    : 0

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Tube<span style={{ color: '#ff4444' }}>Intel</span></span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/discover" style={{ fontSize: 13, color: '#e8e8e8', textDecoration: 'none', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 14px' }}>Discover</Link>
            <Link href="/settings/keys" style={{ fontSize: 13, color: '#e8e8e8', textDecoration: 'none', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 14px' }}>API Keys</Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>My Modules</h1>
            <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>{user.email}</p>
            {hasModules && (
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#888' }}>
                  <span style={{ color: '#e8e8e8', fontWeight: 600 }}>{modules!.length}</span> modules
                </span>
                <span style={{ fontSize: 13, color: '#888' }}>
                  <span style={{ color: '#e8e8e8', fontWeight: 600 }}>{totalSections}</span> sections
                </span>
              </div>
            )}
          </div>
          <Link
            href="/summarize"
            style={{ background: '#ff4444', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}
          >
            + New Module
          </Link>
        </div>

        {!hasModules ? (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>No modules yet</h2>
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px' }}>Paste a YouTube URL to generate your first learning module.</p>
            <Link href="/summarize" style={{ background: '#ff4444', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
              Generate First Module
            </Link>
          </div>
        ) : (
          <div className="modules-grid">
            {(modules as SavedModule[]).map(m => (
              <Link
                key={m.id}
                href={`/modules/${m.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111', flexShrink: 0 }}>
                    <img
                      src={`https://img.youtube.com/vi/${m.video_id}/hqdefault.jpg`}
                      alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {m.video_title || m.summary?.video_title || 'Untitled Video'}
                    </div>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', marginBottom: 14, flex: 1 }}>
                      {m.summary?.overview?.slice(0, 240)}…
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {m.truncated && (
                        <span style={{ fontSize: 11, background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', color: '#ff9800', borderRadius: 4, padding: '2px 7px' }}>
                          Truncated
                        </span>
                      )}
                      {m.notion_page_url && (
                        <span style={{ fontSize: 11, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: '#4caf50', borderRadius: 4, padding: '2px 7px' }}>
                          Saved to Notion
                        </span>
                      )}
                      <span style={{ fontSize: 11, background: '#222', border: '1px solid #2a2a2a', color: '#888', borderRadius: 4, padding: '2px 7px', marginLeft: 'auto' }}>
                        {m.summary?.sections?.length ?? 0} sections
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <style>{`
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 860px) {
          .modules-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .modules-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 14px', color: '#888', fontSize: 13, cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </form>
  )
}
