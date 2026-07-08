'use client'
import Shell from '@/components/Shell'
import { MisaForm } from '@/components/CardForm'
import { useDb } from '@/lib/useDb'

export default function NewMisaPage() {
  const { db } = useDb()
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>
  return (
    <Shell>
      <header className="mb-6">
        <h1 className="h1">Uusi misa</h1>
        <p className="muted mt-1">Esivalmisteltava komponentti — keittiölle selkeä tuotanto-ohje.</p>
      </header>
      <MisaForm brands={db.brands.filter((b) => !b.archived)} />
    </Shell>
  )
}
