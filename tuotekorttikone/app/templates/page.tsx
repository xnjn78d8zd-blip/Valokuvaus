'use client'
import Link from 'next/link'
import { useState } from 'react'
import Shell from '@/components/Shell'
import CardSheet, { type SheetVariant } from '@/components/CardSheet'
import { useDb } from '@/lib/useDb'
import { TEMPLATE_LABELS, type AnyCard, type TemplateKind } from '@/lib/types'

const VARIANT_FOR: Partial<Record<TemplateKind, SheetVariant>> = {
  product: 'product',
  kitchen: 'kitchen',
  misa: 'misa',
  compact: 'compact',
  showcase: 'showcase',
  'a4-portrait': 'product',
}

export default function TemplatesPage() {
  const { db } = useDb()
  const [brandId, setBrandId] = useState('')
  const [template, setTemplate] = useState<TemplateKind>('product')
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>

  const brand = db.brands.find((b) => b.id === brandId) ?? db.brands[0]
  const sample: AnyCard | undefined =
    (template === 'misa'
      ? db.misas.find((m) => m.brandId === brand?.id)
      : db.products.find((p) => p.brandId === brand?.id)) ??
    db.products.find((p) => p.brandId === brand?.id) ??
    db.misas.find((m) => m.brandId === brand?.id)

  return (
    <Shell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Templates</h1>
          <p className="muted mt-1">Korttipohjat brändeittäin. Pohjan tyyli muokataan Brand Template Builderissa.</p>
        </div>
        {brand && (
          <Link href={`/brands/${brand.id}`} className="btn-ghost">Muokkaa pohjaa →</Link>
        )}
      </header>

      <div className="mb-5 flex flex-wrap gap-3">
        <select className="input max-w-52" value={brand?.id} onChange={(e) => setBrandId(e.target.value)}>
          {db.brands.filter((b) => !b.archived).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {(brand?.templates ?? []).map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                template === t ? 'border-brass bg-brass/15 text-brass-bright' : 'border-ink-700 text-ink-400'
              }`}
            >
              {TEMPLATE_LABELS[t]}
              {brand?.defaultTemplate === t && ' ★'}
            </button>
          ))}
        </div>
      </div>

      {brand && sample ? (
        <div className="overflow-auto rounded-xl border border-ink-800 bg-ink-850 p-6">
          <div style={{ zoom: 0.7 }}>
            <CardSheet card={sample} brand={brand} variant={VARIANT_FOR[template] ?? 'product'} />
          </div>
        </div>
      ) : (
        <p className="muted">Luo brändille ensin vähintään yksi kortti nähdäksesi pohjan.</p>
      )}
    </Shell>
  )
}
