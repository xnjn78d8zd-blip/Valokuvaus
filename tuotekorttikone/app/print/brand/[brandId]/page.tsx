'use client'
// Brändin kaikki hyväksytyt kortit yhtenä printtinä / PDF:nä.
import { useParams } from 'next/navigation'
import CardSheet from '@/components/CardSheet'
import { useDb } from '@/lib/useDb'

export default function PrintBrandPage() {
  const { brandId } = useParams<{ brandId: string }>()
  const { db } = useDb()
  if (!db) return null
  const brand = db.brands.find((b) => b.id === brandId)
  if (!brand) return <p className="p-8">Brändiä ei löytynyt.</p>

  const products = db.products.filter((p) => p.brandId === brand.id && p.status === 'approved')
  const misas = db.misas.filter((m) => m.brandId === brand.id && m.status === 'approved')

  return (
    <div className="min-h-screen bg-ink-800 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex w-[210mm] items-center justify-between">
        <p className="text-sm text-ink-300">
          {brand.name} — {products.length + misas.length} hyväksyttyä korttia
        </p>
        <button onClick={() => window.print()} className="btn-primary">Tulosta / Tallenna PDF</button>
      </div>
      <div className="space-y-8 print:space-y-0">
        {products.map((p) => (
          <CardSheet key={p.id} card={p} brand={brand} variant="product" />
        ))}
        {misas.map((m) => (
          <CardSheet key={m.id} card={m} brand={brand} variant="misa" />
        ))}
      </div>
    </div>
  )
}
