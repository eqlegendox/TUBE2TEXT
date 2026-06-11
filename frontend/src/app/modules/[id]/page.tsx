import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SavedModule, Section, KeyTerm, VisualMoment } from '@/types'

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()
  const mod = data as SavedModule
  const summary = mod.summary
  const videoUrl = `https://www.youtube.com/watch?v=${mod.video_id}`

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← My Modules</Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {mod.notion_page_url && (
              <a href={mod.notion_page_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#4caf50', textDecoration: 'none', border: '1px solid rgba(76,175,80,0.3)', padding: '5px 12px', borderRadius: 6 }}>
                Open in Notion ↗
              </a>
            )}
            <a href={videoUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#ff8888', textDecoration: 'none', border: '1px solid rgba(255,136,136,0.3)', padding: '5px 12px', borderRadius: 6 }}>
              Watch Video ↗
            </a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>{summary.video_title}</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#888' }}>
            {new Date(mod.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          {mod.truncated && (
            <span style={{ fontSize: 11, background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', color: '#ff9800', borderRadius: 4, padding: '1px 7px' }}>
              Transcript truncated
            </span>
          )}
        </div>

        {/* Learning Objectives */}
        <Section title="🎯 Learning Objectives">
          <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
            {summary.learning_objectives.map((o, i) => (
              <li key={i} style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 4 }}>{o}</li>
            ))}
          </ul>
        </Section>

        {/* Overview */}
        <Section title="📖 Overview">
          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{summary.overview}</p>
        </Section>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8e8e8', marginBottom: 16 }}>📝 Notes</h2>
          {summary.sections.map((section: Section, i: number) => (
            <SectionBlock key={i} section={section} videoId={mod.video_id} />
          ))}
        </div>

        {/* Key Takeaways */}
        <Section title="✅ Key Takeaways">
          <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
            {summary.key_takeaways.map((t, i) => (
              <li key={i} style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 4 }}>{t}</li>
            ))}
          </ul>
        </Section>

        {/* Review Questions */}
        <Section title="🧠 Review Questions">
          <ol style={{ margin: 0, padding: '0 0 0 20px' }}>
            {summary.review_questions.map((q, i) => (
              <li key={i} style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>{q}</li>
            ))}
          </ol>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8e8e8', marginBottom: 14 }}>{title}</h2>
      {children}
    </div>
  )
}

function tsToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

function SectionBlock({ section, videoId }: { section: Section; videoId: string }) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const tsUrl = `${videoUrl}&t=${tsToSeconds(section.timestamp)}s`

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <a href={tsUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: '#ff8888', textDecoration: 'none', fontFamily: 'monospace', fontSize: 13 }}>
          [{section.timestamp}]
        </a>
        <span style={{ color: '#e8e8e8' }}>{section.title}</span>
      </h3>

      <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.8, marginBottom: section.key_terms.length ? 16 : 0, whiteSpace: 'pre-line' }}>
        {section.concept_explanation}
      </p>

      {section.key_terms.length > 0 && (
        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#93bbfd', marginBottom: 10 }}>📌 Key Terms</div>
          {section.key_terms.map((kt: KeyTerm, i: number) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 6, color: '#ccc' }}>
              <strong style={{ color: '#e8e8e8' }}>{kt.term}</strong> — {kt.definition}
            </div>
          ))}
        </div>
      )}

      {section.example && (
        <Callout icon="💡" color="rgba(255,193,7,0.1)" borderColor="rgba(255,193,7,0.25)" label="Example">
          {section.example}
        </Callout>
      )}

      {section.why_it_matters && (
        <Callout icon="⚡" color="rgba(76,175,80,0.08)" borderColor="rgba(76,175,80,0.25)" label="Why it matters">
          {section.why_it_matters}
        </Callout>
      )}

      {section.visual_moments.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10 }}>📺 Visual References</div>
          {section.visual_moments.map((vm: VisualMoment, i: number) => (
            <a key={i} href={`${videoUrl}&t=${tsToSeconds(vm.timestamp)}s`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', fontSize: 13, color: '#ff8888', textDecoration: 'none', lineHeight: 1.6, marginBottom: 4 }}>
              [{vm.timestamp}] {vm.description}
            </a>
          ))}
        </div>
      )}

      {section.section_takeaways.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 8 }}>Takeaways</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
            {section.section_takeaways.map((t: string, i: number) => (
              <li key={i} style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, marginBottom: 4 }}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Callout({ icon, color, borderColor, label, children }: {
  icon: string; color: string; borderColor: string; label: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: color, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>{icon} {label}</div>
      <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}
