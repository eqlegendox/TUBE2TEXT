import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Railway calls take 20-60s — set a generous timeout
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { video_id } = await request.json()
  if (!video_id) return NextResponse.json({ error: 'video_id is required' }, { status: 400 })

  // Fetch the user's BYOK keys
  const { data: userKeys } = await supabase
    .from('user_keys')
    .select('gemini_api_key, groq_api_key, notion_api_key, notion_database_id')
    .eq('user_id', user.id)
    .single()

  if (!userKeys?.gemini_api_key && !userKeys?.groq_api_key) {
    return NextResponse.json(
      { error: 'No AI API key configured. Please add your Gemini or Groq API key in Settings → API Keys.' },
      { status: 422 }
    )
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

  // Forward to Railway backend with per-user keys injected
  let backendRes: Response
  try {
    backendRes = await fetch(`${backendUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id,
        gemini_api_key: userKeys?.gemini_api_key ?? null,
        groq_api_key: userKeys?.groq_api_key ?? null,
        notion_api_key: userKeys?.notion_api_key ?? null,
        notion_database_id: userKeys?.notion_database_id ?? null,
      }),
    })
  } catch (err) {
    console.error('Backend unreachable:', err)
    return NextResponse.json({ error: 'Could not reach the backend. Make sure it is running.' }, { status: 502 })
  }

  if (!backendRes.ok) {
    const detail = await backendRes.json().catch(() => ({ detail: backendRes.statusText }))
    return NextResponse.json({ error: detail.detail ?? 'Backend error' }, { status: backendRes.status })
  }

  const module = await backendRes.json()

  // Save to Supabase
  const { data: saved, error: saveError } = await supabase
    .from('modules')
    .insert({
      user_id: user.id,
      video_id,
      video_title: module.video_title ?? null,
      notion_page_url: module.notion_page_url ?? null,
      notion_error: module.notion_error ?? null,
      truncated: module.truncated ?? false,
      summary: module,
    })
    .select('id')
    .single()

  if (saveError) {
    console.error('Supabase save error:', saveError)
    return NextResponse.json({ error: 'Failed to save module: ' + saveError.message }, { status: 500 })
  }

  return NextResponse.json({ id: saved.id, ...module })
}
