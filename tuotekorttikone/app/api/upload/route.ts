import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// DEMO-tila: tallennus public/uploads-kansioon.
// Supabase-tila: vaihda tähän Supabase Storage -upload (ks. README kohta "Supabase").
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Tiedosto puuttuu' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Vain kuvatiedostot' }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Kuva on liian suuri (max 8 Mt)' }, { status: 400 })
  }
  const dir = path.join(process.cwd(), 'public', 'uploads')
  fs.mkdirSync(dir, { recursive: true })
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
  return NextResponse.json({ url: `/uploads/${name}` })
}
