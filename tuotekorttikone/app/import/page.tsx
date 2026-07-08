'use client'
// Smart Import: liitä raakatekstiä missä muodossa tahansa → jäsennetty kortti.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/Shell'
import MissingFieldsPanel from '@/components/MissingFieldsPanel'
import { useDb } from '@/lib/useDb'
import { api } from '@/lib/api'
import type { ParsedCard, MissingField } from '@/lib/parser'
import { ALLERGENS } from '@/lib/types'

const EXAMPLES = [
  `Hot Honey Burger: briossi, kanafilee 120 g, hot honey, suolakurkku, DF-majo. Paisto 175 astetta 4 min. Allergeenit gluteeni, maito, kananmuna.`,
  `Kastike: 1 kg majoneesia, 80 g valkosipulia, 20 g persiljaa, 30 g sitruunaa, 12 g suolaa. Säilyy 4 päivää kylmässä.`,
]

export default function SmartImportPage() {
  const { db } = useDb()
  const router = useRouter()
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ parsed: ParsedCard; provider: string; missing: MissingField[] }>()
  const [brandId, setBrandId] = useState('')
  const [skipped, setSkipped] = useState<string[]>([])

  const parse = async () => {
    setBusy(true)
    try {
      const r = await api.parse(raw)
      setResult(r)
      setSkipped([])
    } finally {
      setBusy(false)
    }
  }

  const createCard = async () => {
    if (!result || !db) return
    const p = result.parsed
    const target = brandId || db.brands[0]?.id
    const saved = await api.saveCard({
      kind: p.kind,
      brandId: target,
      name: p.name,
      description: p.description,
      category: p.category,
      ingredients: p.ingredients,
      instructions: p.instructions,
      assembly: p.assembly,
      serving: p.serving,
      storage: p.storage,
      shelfLife: p.shelfLife,
      temperatures: p.temperatures,
      prepTime: p.prepTime,
      portionSize: p.portionSize,
      portionWeight: p.portionWeight,
      price: p.price,
      allergens: p.allergens,
      allergenOther: p.allergenOther,
      yieldAmount: p.yieldAmount,
      container: p.container,
      storageTemp: p.storageTemp,
      dosing: p.dosing,
      usedIn: p.usedIn,
      notApplicable: skipped,
      status: 'draft',
    } as Parameters<typeof api.saveCard>[0])
    router.push(`/${p.kind === 'misa' ? 'misas' : 'products'}/${saved.id}`)
  }

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="h1">Smart Import</h1>
        <p className="muted mt-1">
          Liitä resepti, luonnos, taulukko tai WhatsApp-viesti — sovellus jäsentää sen kortiksi ja
          kertoo mitä puuttuu.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <textarea
            className="input min-h-64 font-mono text-[13px]"
            placeholder="Liitä raakateksti tähän…"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={parse} disabled={busy || !raw.trim()} className="btn-primary">
              {busy ? 'Jäsennetään…' : 'Jäsennä tiedot'}
            </button>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setRaw(ex)} className="btn-ghost text-xs">
                Esimerkki {i + 1}
              </button>
            ))}
          </div>
          {result && (
            <p className="text-xs text-ink-500">
              Jäsennin: <b>{result.provider}</b>
              {result.provider === 'heuristic' &&
                ' (sääntöpohjainen — lisää ANTHROPIC_API_KEY tai OPENAI_API_KEY .env-tiedostoon LLM-jäsennystä varten)'}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {!result && (
            <div className="panel flex h-64 items-center justify-center px-6 text-center text-sm text-ink-500">
              Jäsennetty tulos näkyy tässä.
            </div>
          )}
          {result && (
            <>
              <div className="panel px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold">
                    {result.parsed.kind === 'misa' ? 'Misa' : 'Tuote'}: {result.parsed.name ?? 'Nimetön'}
                  </h3>
                  <select className="input max-w-44" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                    {db?.brands.filter((b) => !b.archived).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {(
                    [
                      ['Raaka-aineet', result.parsed.ingredients.map((i) => `${i.name} ${i.amount}${i.unit}`.trim()).join(', ')],
                      ['Ohje', result.parsed.instructions],
                      ['Lämpötilat', result.parsed.temperatures],
                      ['Aika', result.parsed.prepTime],
                      ['Säilyvyys', result.parsed.shelfLife],
                      ['Säilytys', result.parsed.storageTemp],
                      ['Hinta', result.parsed.price],
                      [
                        'Allergeenit',
                        result.parsed.allergens
                          .map((k) => ALLERGENS.find((a) => a.key === k)?.label)
                          .filter(Boolean)
                          .join(', '),
                      ],
                    ] as const
                  )
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="col-span-2 flex gap-2">
                        <dt className="w-28 shrink-0 text-ink-500">{k}</dt>
                        <dd className="min-w-0 flex-1">{v}</dd>
                      </div>
                    ))}
                </dl>
              </div>

              <MissingFieldsPanel
                missing={result.missing}
                notApplicable={skipped}
                onSkip={(key) => setSkipped((s) => [...s, key])}
              />

              <button onClick={createCard} className="btn-primary w-full justify-center">
                Luo kortti ja jatka muokkaukseen →
              </button>
            </>
          )}
        </div>
      </div>
    </Shell>
  )
}
