'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/Shell'
import BrandCard from '@/components/BrandCard'
import { useDb } from '@/lib/useDb'
import { api, can, getRole } from '@/lib/api'

export default function BrandsPage() {
  const { db, reload } = useDb()
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const role = getRole()

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    const brand = await api.saveBrand({ name: name.trim() })
    setBusy(false)
    setName('')
    reload()
    router.push(`/brands/${brand.id}`)
  }

  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>
  const brands = db.brands.filter((b) => !b.archived)

  return (
    <Shell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Brändit</h1>
          <p className="muted mt-1">Jokaisella brändillä on oma visuaalinen pohja — kortit perivät sen automaattisesti.</p>
        </div>
        {can.createBrand(role) && (
          <div className="flex gap-2">
            <input
              className="input w-56"
              placeholder="Uuden brändin nimi…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
            <button onClick={create} disabled={busy || !name.trim()} className="btn-primary">
              Luo brändi
            </button>
          </div>
        )}
      </header>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {brands.map((b) => (
          <BrandCard
            key={b.id}
            brand={b}
            cardCount={
              db.products.filter((p) => p.brandId === b.id && p.status !== 'archived').length +
              db.misas.filter((m) => m.brandId === b.id && m.status !== 'archived').length
            }
          />
        ))}
      </div>
    </Shell>
  )
}
