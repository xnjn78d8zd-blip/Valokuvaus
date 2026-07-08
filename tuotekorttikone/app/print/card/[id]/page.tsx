'use client'
// Printtinäkymä: identtinen esikatselun kanssa. Selaimen Tulosta → PDF toimii aina.
import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import CardSheet, { type SheetVariant } from '@/components/CardSheet'
import { useDb } from '@/lib/useDb'

function PrintCardInner() {
  const { id } = useParams<{ id: string }>()
  const variant = (useSearchParams().get('variant') ?? 'product') as SheetVariant
  const { db } = useDb()
  if (!db) return null
  const card = [...db.products, ...db.misas].find((c) => c.id === id)
  const brand = card && db.brands.find((b) => b.id === card.brandId)
  if (!card || !brand) return <p className="p-8">Korttia ei löytynyt.</p>

  return (
    <div className="min-h-screen bg-ink-800 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex w-[210mm] justify-end gap-2">
        <button onClick={() => window.print()} className="btn-primary">
          Tulosta / Tallenna PDF
        </button>
      </div>
      <CardSheet card={card} brand={brand} variant={variant} />
    </div>
  )
}

export default function PrintCardPage() {
  return (
    <Suspense>
      <PrintCardInner />
    </Suspense>
  )
}
