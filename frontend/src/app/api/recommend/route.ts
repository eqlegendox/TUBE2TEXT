import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const topic = request.nextUrl.searchParams.get('topic')
  if (!topic?.trim()) return NextResponse.json({ error: 'topic is required' }, { status: 400 })

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/recommend?topic=${encodeURIComponent(topic)}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      return NextResponse.json({ error: err.detail ?? 'Backend error' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Could not reach the backend.' }, { status: 502 })
  }
}
