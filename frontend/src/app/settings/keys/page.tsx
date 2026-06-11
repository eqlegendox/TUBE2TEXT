'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserKeys } from '@/types'

export default function KeysPage() {
  const [keys, setKeys] = useState<UserKeys>({ gemini_api_key: '', groq_api_key: '', notion_api_key: '', notion_database_id: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('user_keys').select('*').eq('user_id', user.id).single()
      if (data) setKeys({ gemini_api_key: data.gemini_api_key ?? '', groq_api_key: data.groq_api_key ?? '', notion_api_key: data.notion_api_key ?? '', notion_database_id: data.notion_database_id ?? '' })
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }
    const { error } = await supabase.from('user_keys').upsert({
      user_id: user.id,
      gemini_api_key: keys.gemini_api_key || null,
      groq_api_key: keys.groq_api_key || null,
      notion_api_key: keys.notion_api_key || null,
      notion_database_id: keys.notion_database_id || null,
      updated_at: new Date().toISOString(),
    })
    if (error) setError(error.message)
    else setSaved(true)
    setSaving(false)
  }

  const field = (label: string, key: keyof UserKeys, placeholder: string, hint: string, required = false) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 4 }}>
        {label} {required && <span style={{ color: '#ff4444' }}>*</span>}
      </label>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6, lineHeight: 1.5 }}>{hint}</div>
      <input
        type="password"
        value={keys[key] ?? ''}
        onChange={e => setKeys(k => ({ ...k, [key]: e.target.value }))}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e8e8e8', outline: 'none', fontFamily: 'monospace' }}
      />
    </div>
  )

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      <header style={{ borderBottom: '1px solid #2a2a2a', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Tube<span style={{ color: '#ff4444' }}>Intel</span></span>
        </div>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>API Keys</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
          Your keys are stored securely in your account and only used when you generate modules. At least one AI key is required.
        </p>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: 28 }}>
          <form onSubmit={handleSave}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #2a2a2a' }}>
              🤖 AI Provider (at least one required)
            </div>
            {field('Gemini API Key', 'gemini_api_key', 'AIza…', 'Get a free key at aistudio.google.com — recommended, handles any video length.')}
            {field('Groq API Key', 'groq_api_key', 'gsk_…', 'Get a free key at console.groq.com — used as fallback when Gemini fails.')}

            <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #2a2a2a', marginTop: 8 }}>
              📓 Notion (optional — saves modules to your Notion)
            </div>
            {field('Notion Integration Token', 'notion_api_key', 'secret_…', 'Create at notion.so/my-integrations → New integration → copy the token.')}
            {field('Notion Database ID', 'notion_database_id', '6ea2c5cd…', 'The 32-character ID from your Notion database URL (before the ?v=).')}

            {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 12px', color: '#ff8888', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            {saved && <div style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 8, padding: '10px 12px', color: '#4caf50', fontSize: 13, marginBottom: 16 }}>✓ Keys saved successfully</div>}

            <button
              type="submit"
              disabled={saving}
              style={{ background: saving ? '#555' : '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save Keys'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
