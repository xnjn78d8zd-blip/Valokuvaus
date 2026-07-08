'use client'
import Shell from '@/components/Shell'
import { ProductForm } from '@/components/CardForm'
import { useDb } from '@/lib/useDb'

export default function NewProductPage() {
  const { db } = useDb()
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>
  return (
    <Shell>
      <header className="mb-6">
        <h1 className="h1">Uusi tuotekortti</h1>
        <p className="muted mt-1">Valitse brändi, täytä tiedot — esikatselu päivittyy reaaliajassa.</p>
      </header>
      <ProductForm brands={db.brands.filter((b) => !b.archived)} />
    </Shell>
  )
}
