import { NextRequest, NextResponse } from 'next/server'
import { smartParse } from '@/lib/llm'
import { missingFields } from '@/lib/parser'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { raw } = (await req.json()) as { raw?: string }
  if (!raw?.trim()) {
    return NextResponse.json({ error: 'Tyhjä syöte' }, { status: 400 })
  }
  const { parsed, provider } = await smartParse(raw)
  return NextResponse.json({ parsed, provider, missing: missingFields(parsed) })
}
