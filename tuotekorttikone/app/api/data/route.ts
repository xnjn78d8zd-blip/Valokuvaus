import { NextRequest, NextResponse } from 'next/server'
import { readDb, writeDb, audit, newId } from '@/lib/store'
import { validateForApproval } from '@/lib/validate'
import type { AnyCard, Brand, Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

function roleFrom(req: NextRequest): Role {
  const r = req.cookies.get('tk_role')?.value
  return r === 'editor' || r === 'viewer' ? r : 'admin'
}

export async function GET() {
  return NextResponse.json(readDb())
}

export async function POST(req: NextRequest) {
  const role = roleFrom(req)
  const body = (await req.json()) as {
    entity: 'brand' | 'card'
    data?: Partial<Brand> | Partial<AnyCard>
    delete?: string
    note?: string
  }
  const db = readDb()
  const by = role

  if (body.entity === 'brand') {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Vain admin voi hallita brändejä' }, { status: 403 })
    }
    if (body.delete) {
      db.brands = db.brands.map((b) => (b.id === body.delete ? { ...b, archived: true } : b))
      audit(db, by, 'brand.archive', body.delete)
      writeDb(db)
      return NextResponse.json({ ok: true })
    }
    const data = body.data as Partial<Brand>
    let brand = data.id ? db.brands.find((b) => b.id === data.id) : undefined
    if (brand) {
      Object.assign(brand, data)
      audit(db, by, 'brand.update', brand.id, brand.name)
    } else {
      brand = {
        name: data.name ?? 'Uusi brändi',
        slug: (data.name ?? 'brandi').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        colors: data.colors ?? {
          primary: '#111111',
          secondary: '#888888',
          accent: '#c9a15a',
          paper: '#ffffff',
          text: '#111111',
        },
        fontStyle: data.fontStyle ?? 'sans',
        headingStyle: data.headingStyle ?? 'uppercase',
        cardStyle: data.cardStyle ?? 'minimal',
        imageStyle: data.imageStyle ?? 'rounded',
        defaultTemplate: data.defaultTemplate ?? 'product',
        templates: data.templates ?? ['product', 'kitchen', 'misa', 'allergen', 'compact'],
        version: data.version ?? '1.0',
        createdAt: new Date().toISOString(),
        ...data,
        id: data.id ?? newId('brand'),
      } as Brand
      db.brands.push(brand)
      audit(db, by, 'brand.create', brand.id, brand.name)
    }
    writeDb(db)
    return NextResponse.json(brand)
  }

  // ── Kortit ──
  if (body.delete) {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Vain admin voi poistaa kortteja' }, { status: 403 })
    }
    db.products = db.products.filter((p) => p.id !== body.delete)
    db.misas = db.misas.filter((m) => m.id !== body.delete)
    audit(db, by, 'card.delete', body.delete)
    writeDb(db)
    return NextResponse.json({ ok: true })
  }

  if (role === 'viewer') {
    return NextResponse.json({ error: 'Viewer-rooli ei voi muokata' }, { status: 403 })
  }

  const data = body.data as Partial<AnyCard>
  if (data.status === 'approved') {
    const errors = validateForApproval(data)
    if (errors.length) {
      return NextResponse.json(
        { error: 'Kriittisiä tietoja puuttuu: ' + errors.map((e) => e.message).join(' · ') },
        { status: 422 },
      )
    }
  }

  const coll = data.kind === 'misa' ? db.misas : db.products
  const existing = data.id ? (coll as AnyCard[]).find((c) => c.id === data.id) : undefined
  const nowIso = new Date().toISOString()

  if (existing) {
    // versionhallinta: talleta vanha tila snapshotiksi
    const changed = Object.keys(data).filter(
      (k) =>
        !['versions', 'updatedAt', 'updatedBy'].includes(k) &&
        JSON.stringify((existing as unknown as Record<string, unknown>)[k]) !==
          JSON.stringify((data as unknown as Record<string, unknown>)[k]),
    )
    if (changed.length) {
      const { versions: _v, ...snapshot } = existing as AnyCard & { versions: unknown }
      existing.versions = [
        {
          version: existing.version,
          savedAt: existing.updatedAt,
          savedBy: existing.updatedBy,
          note: body.note,
          changed,
          snapshot,
        },
        ...(existing.versions ?? []),
      ].slice(0, 50)
    }
    Object.assign(existing, data, { updatedAt: nowIso, updatedBy: by })
    audit(db, by, 'card.update', existing.id, `${existing.name} (${changed.join(', ')})`)
    writeDb(db)
    return NextResponse.json(existing)
  }

  const card = {
    ingredients: [],
    allergens: [],
    diets: [],
    versions: [],
    version: '1.0',
    status: 'draft',
    ...data,
    id: newId(data.kind === 'misa' ? 'misa' : 'prod'),
    updatedAt: nowIso,
    updatedBy: by,
  } as AnyCard
  ;(coll as AnyCard[]).push(card)
  audit(db, by, 'card.create', card.id, card.name)
  writeDb(db)
  return NextResponse.json(card)
}
