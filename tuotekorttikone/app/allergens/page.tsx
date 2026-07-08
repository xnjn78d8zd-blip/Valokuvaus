'use client'
import Link from 'next/link'
import { useState } from 'react'
import Shell from '@/components/Shell'
import { useDb } from '@/lib/useDb'
import { ALLERGENS, type AnyCard } from '@/lib/types'

export default function AllergensPage() {
  const { db } = useDb()
  const [brandId, setBrandId] = useState('')
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>

  const brand = db.brands.find((b) => b.id === brandId) ?? db.brands[0]
  const cards: AnyCard[] = [...db.products, ...db.misas].filter(
    (c) => c.brandId === brand?.id && c.status !== 'archived',
  )

  return (
    <Shell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Allergeenit</h1>
          <p className="muted mt-1">Brändin allergeenimatriisi — printattavissa keittiön seinälle.</p>
        </div>
        <div className="flex gap-3">
          <select className="input max-w-52" value={brand?.id} onChange={(e) => setBrandId(e.target.value)}>
            {db.brands.filter((b) => !b.archived).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {brand && (
            <Link href={`/print/allergens/${brand.id}`} target="_blank" className="btn-primary">
              Printtaa kooste
            </Link>
          )}
        </div>
      </header>

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800">
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-ink-500">Tuote</th>
              {ALLERGENS.map((a) => (
                <th key={a.key} className="px-1 py-3 text-center text-[10px] text-ink-500" title={a.label}>
                  {a.short}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-ink-500">Muut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60">
            {cards.map((c) => (
              <tr key={c.id} className="hover:bg-ink-800/30">
                <td className="px-4 py-2.5 font-medium">
                  <Link href={`/${c.kind === 'misa' ? 'misas' : 'products'}/${c.id}`} className="hover:text-brass-bright">
                    {c.name}
                  </Link>
                  {c.allergensUnknown && <span className="ml-2 text-xs text-amber-400">EI TIEDOSSA</span>}
                </td>
                {ALLERGENS.map((a) => (
                  <td key={a.key} className="px-1 py-2.5 text-center">
                    {c.allergens.includes(a.key) ? (
                      <span className="inline-block h-3 w-3 rounded-full bg-brass" />
                    ) : (
                      <span className="text-ink-700">·</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-xs text-ink-400">{c.allergenOther ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mt-3 text-xs">
        {ALLERGENS.map((a) => `${a.short} = ${a.label}`).join(' · ')}
      </p>
    </Shell>
  )
}
