'use client'
// Kortin muokkaussivu: lomake + versiohistoria + print/PDF-toiminnot.
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Shell from './Shell'
import CardForm from './CardForm'
import VersionHistory from './VersionHistory'
import StatusBadge from './StatusBadge'
import PdfExportButton from './PdfExportButton'
import { useDb } from '@/lib/useDb'
import { api } from '@/lib/api'
import type { AnyCard, VersionEntry } from '@/lib/types'

export default function CardEditPage({ kind }: { kind: 'product' | 'misa' }) {
  const { id } = useParams<{ id: string }>()
  const { db, reload } = useDb()
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>

  const coll: AnyCard[] = kind === 'misa' ? db.misas : db.products
  const card = coll.find((c) => c.id === id)
  if (!card) {
    return (
      <Shell>
        <p className="muted">Korttia ei löytynyt.</p>
        <Link href={kind === 'misa' ? '/misas' : '/products'} className="btn-ghost mt-4">← Takaisin</Link>
      </Shell>
    )
  }

  const brand = db.brands.find((b) => b.id === card.brandId)
  const gallery = [
    ...new Set(
      [...db.products, ...db.misas]
        .filter((c) => c.brandId === card.brandId && c.imageUrl)
        .map((c) => c.imageUrl as string),
    ),
  ]

  const restore = async (v: VersionEntry) => {
    if (!confirm(`Palautetaanko versio ${v.version}?`)) return
    await api.saveCard(
      { ...(v.snapshot as Partial<AnyCard>), id: card.id, kind: card.kind },
      { note: `Palautettu versiosta ${v.version}` },
    )
    reload()
    location.reload()
  }

  const printVariant = kind === 'misa' ? 'misa' : 'product'

  return (
    <Shell>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label">{brand?.name} · {kind === 'misa' ? 'Misa' : 'Tuotekortti'}</p>
          <h1 className="h1 flex items-center gap-3">
            {card.name} <StatusBadge status={card.status} />
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/print/card/${card.id}?variant=${printVariant}`} target="_blank" className="btn-ghost">
            Printtinäkymä
          </Link>
          {kind === 'product' && (
            <Link href={`/print/card/${card.id}?variant=kitchen`} target="_blank" className="btn-ghost">
              Keittiöohje
            </Link>
          )}
          <PdfExportButton printUrl={`/print/card/${card.id}?variant=${printVariant}`} />
        </div>
      </header>

      <CardForm kind={kind} brands={db.brands.filter((b) => !b.archived)} initial={card} gallery={gallery} />

      <div className="mt-8 max-w-2xl">
        <VersionHistory current={card} versions={card.versions} onRestore={restore} />
      </div>
    </Shell>
  )
}
