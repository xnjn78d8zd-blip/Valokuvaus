'use client'
// Yhteinen listanäkymä tuotteille ja misoille: haku, suodatus, arkisto.
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Shell from './Shell'
import StatusBadge from './StatusBadge'
import { useDb } from '@/lib/useDb'
import { api, can, getRole } from '@/lib/api'
import type { AnyCard } from '@/lib/types'

export default function CardListPage({ kind }: { kind: 'product' | 'misa' }) {
  const { db, reload } = useDb()
  const params = useSearchParams()
  const role = getRole()
  const [q, setQ] = useState('')
  const [brandId, setBrandId] = useState(params.get('brand') ?? '')
  const [category, setCategory] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const base = kind === 'misa' ? '/misas' : '/products'
  const cards: AnyCard[] = useMemo(() => {
    if (!db) return []
    const coll: AnyCard[] = kind === 'misa' ? db.misas : db.products
    return coll
      .filter((c) => (showArchived ? true : c.status !== 'archived'))
      .filter((c) => !brandId || c.brandId === brandId)
      .filter((c) => !category || ('category' in c && (c as { category?: string }).category === category))
      .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [db, kind, q, brandId, category, showArchived])

  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>

  const categories = [
    ...new Set(
      db.products
        .map((p) => p.category)
        .filter((c): c is string => Boolean(c)),
    ),
  ]

  const duplicate = async (c: AnyCard) => {
    const copy = { ...c, id: undefined, name: c.name + ' (kopio)', status: 'draft' as const, version: '1.0', versions: [] }
    const saved = await api.saveCard(copy as Partial<AnyCard>)
    location.href = `${base}/${saved.id}`
  }

  const archive = async (c: AnyCard, restore = false) => {
    await api.saveCard({ id: c.id, kind: c.kind, status: restore ? 'draft' : 'archived' } as Partial<AnyCard>)
    reload()
  }

  return (
    <Shell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">{kind === 'misa' ? 'Misat' : 'Tuotekortit'}</h1>
          <p className="muted mt-1">
            {kind === 'misa' ? 'Esivalmisteltavat komponentit.' : 'Kaikki brändien tuotekortit.'}
          </p>
        </div>
        {can.editCard(role) && (
          <Link href={`${base}/new`} className="btn-primary">+ Uusi {kind === 'misa' ? 'misa' : 'tuotekortti'}</Link>
        )}
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input className="input max-w-60" placeholder="Hae nimellä…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-48" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">Kaikki brändit</option>
          {db.brands.filter((b) => !b.archived).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {kind === 'product' && (
          <select className="input max-w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Kaikki kategoriat</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-ink-400">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Näytä arkistoidut
        </label>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3">Nimi</th>
              <th className="px-3 py-3">Brändi</th>
              {kind === 'product' && <th className="px-3 py-3">Kategoria</th>}
              <th className="px-3 py-3">Versio</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Muokattu</th>
              <th className="px-3 py-3 text-right">Toiminnot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60">
            {cards.map((c) => {
              const brand = db.brands.find((b) => b.id === c.brandId)
              return (
                <tr key={c.id} className="hover:bg-ink-800/30">
                  <td className="px-5 py-3">
                    <Link href={`${base}/${c.id}`} className="font-semibold hover:text-brass-bright">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: brand?.colors.primary }} />
                      {brand?.name}
                    </span>
                  </td>
                  {kind === 'product' && (
                    <td className="px-3 py-3 text-ink-400">{(c as { category?: string }).category ?? '—'}</td>
                  )}
                  <td className="px-3 py-3 text-ink-400">v{c.version}</td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3 text-ink-400">{new Date(c.updatedAt).toLocaleDateString('fi-FI')}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/print/card/${c.id}?variant=${kind === 'misa' ? 'misa' : 'product'}`}
                        target="_blank"
                        className="btn-ghost px-2.5 py-1 text-xs"
                      >
                        Print
                      </Link>
                      {can.editCard(role) && (
                        <button onClick={() => duplicate(c)} className="btn-ghost px-2.5 py-1 text-xs">Kopioi</button>
                      )}
                      {can.editCard(role) &&
                        (c.status === 'archived' ? (
                          <button onClick={() => archive(c, true)} className="btn-ghost px-2.5 py-1 text-xs">Palauta</button>
                        ) : (
                          <button onClick={() => archive(c)} className="btn-ghost px-2.5 py-1 text-xs">Arkistoi</button>
                        ))}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!cards.length && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-ink-500">Ei kortteja hakuehdoilla.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  )
}
