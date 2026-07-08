'use client'
import Link from 'next/link'
import { useState } from 'react'
import Shell from '@/components/Shell'
import PdfExportButton from '@/components/PdfExportButton'
import StatusBadge from '@/components/StatusBadge'
import { useDb } from '@/lib/useDb'
import type { AnyCard } from '@/lib/types'

export default function ExportPage() {
  const { db } = useDb()
  const [brandId, setBrandId] = useState('')
  const [showAll, setShowAll] = useState(false)
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>

  const brand = db.brands.find((b) => b.id === brandId) ?? db.brands[0]
  const cards: AnyCard[] = [...db.products, ...db.misas]
    .filter((c) => c.brandId === brand?.id && c.status !== 'archived')
    .filter((c) => showAll || c.status === 'approved')

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="h1">Export / Print</h1>
        <p className="muted mt-1">
          Oletuksena näkyvät vain hyväksytyt kortit — keittiön printtinäkymä.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select className="input max-w-52" value={brand?.id} onChange={(e) => setBrandId(e.target.value)}>
          {db.brands.filter((b) => !b.archived).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-400">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Näytä myös luonnokset ja tarkistettavat
        </label>
        {brand && (
          <div className="ml-auto flex gap-2">
            <Link href={`/print/allergens/${brand.id}`} target="_blank" className="btn-ghost">
              Allergeenikooste
            </Link>
            <Link href={`/print/brand/${brand.id}`} target="_blank" className="btn-ghost">
              Kaikki kortit -printti
            </Link>
            <PdfExportButton
              printUrl={`/print/brand/${brand.id}`}
              label={`${brand.name} — kaikki kortit PDF`}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.id} className="panel px-5 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-ink-500">
                  {c.kind === 'misa' ? 'Misa' : 'Tuote'} · v{c.version}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Link
                href={`/print/card/${c.id}?variant=${c.kind === 'misa' ? 'misa' : 'product'}`}
                target="_blank"
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                {c.kind === 'misa' ? 'Misa-ohje' : 'A4 tuotekortti'}
              </Link>
              {c.kind === 'product' && (
                <Link href={`/print/card/${c.id}?variant=kitchen`} target="_blank" className="btn-ghost px-3 py-1.5 text-xs">
                  A4 keittiöohje
                </Link>
              )}
              <PdfExportButton
                printUrl={`/print/card/${c.id}?variant=${c.kind === 'misa' ? 'misa' : 'product'}`}
                label="PDF"
              />
            </div>
          </div>
        ))}
        {!cards.length && <p className="muted">Ei kortteja valituilla ehdoilla.</p>}
      </div>
    </Shell>
  )
}
