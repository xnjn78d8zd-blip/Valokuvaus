'use client'
// Allergeenikooste: brändin tuotteet × allergeenit, printattava A4.
import { useParams } from 'next/navigation'
import { useDb } from '@/lib/useDb'
import { ALLERGENS } from '@/lib/types'
import { brandVars } from '@/lib/brand-style'

export default function PrintAllergensPage() {
  const { brandId } = useParams<{ brandId: string }>()
  const { db } = useDb()
  if (!db) return null
  const brand = db.brands.find((b) => b.id === brandId)
  if (!brand) return <p className="p-8">Brändiä ei löytynyt.</p>
  const cards = [...db.products, ...db.misas].filter(
    (c) => c.brandId === brand.id && c.status !== 'archived',
  )

  return (
    <div className="min-h-screen bg-ink-800 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex w-[210mm] justify-end">
        <button onClick={() => window.print()} className="btn-primary">Tulosta / Tallenna PDF</button>
      </div>
      <div
        className="card-sheet print-page mx-auto flex w-[210mm] min-h-[296mm] flex-col px-[12mm] py-[12mm] shadow-pop"
        style={brandVars(brand)}
      >
        <div className="mb-4 flex items-end justify-between border-b-2 pb-3" style={{ borderColor: 'var(--b-primary)' }}>
          <div>
            <div className="text-[9pt] uppercase tracking-[0.2em] opacity-60">Allergeenikooste</div>
            <h1 className="b-heading text-[20pt] font-bold" style={{ color: 'var(--b-primary)' }}>
              {brand.name}
            </h1>
          </div>
          <div className="text-right text-[8pt] opacity-70">
            {new Date().toLocaleDateString('fi-FI')}
          </div>
        </div>
        <table className="w-full text-[8.5pt]">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--b-primary)' }}>
              <th className="py-1.5 pr-2 text-left">Tuote</th>
              {ALLERGENS.map((a) => (
                <th key={a.key} className="w-[9mm] py-1.5 text-center align-bottom" title={a.label}>
                  <span className="inline-block -rotate-60 whitespace-nowrap text-[7pt]">{a.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((c, i) => (
              <tr
                key={c.id}
                style={{ background: i % 2 ? 'color-mix(in srgb, var(--b-secondary) 8%, transparent)' : undefined }}
              >
                <td className="border-b py-1.5 pr-2 font-semibold" style={{ borderColor: 'color-mix(in srgb, var(--b-text) 15%, transparent)' }}>
                  {c.name}
                  <span className="ml-1 font-normal opacity-60">{c.kind === 'misa' ? '(misa)' : ''}</span>
                  {c.allergensUnknown && <span className="ml-2 font-bold" style={{ color: 'var(--b-accent)' }}>EI TIEDOSSA</span>}
                  {c.allergenOther && <div className="text-[7pt] font-normal opacity-70">+ {c.allergenOther}</div>}
                </td>
                {ALLERGENS.map((a) => (
                  <td key={a.key} className="border-b text-center" style={{ borderColor: 'color-mix(in srgb, var(--b-text) 15%, transparent)' }}>
                    {c.allergens.includes(a.key) ? (
                      <span className="inline-block h-[3mm] w-[3mm] rounded-full" style={{ background: 'var(--b-primary)' }} />
                    ) : (
                      ''
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-auto border-t pt-2 text-[7pt] opacity-70" style={{ borderColor: 'var(--b-secondary)' }}>
          {brand.footerText ?? brand.name} · Tarkista aina myös pakkausmerkinnät ja misojen kortit.
        </div>
      </div>
    </div>
  )
}
