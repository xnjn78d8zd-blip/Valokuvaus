'use client'
// Brand Template Builder: brändin visuaalinen pohja + live-esikatselu.
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Shell from '@/components/Shell'
import CardSheet from '@/components/CardSheet'
import ImageUploader from '@/components/ImageUploader'
import { useDb } from '@/lib/useDb'
import { api, can, getRole } from '@/lib/api'
import {
  TEMPLATE_LABELS,
  type Brand,
  type TemplateKind,
  type AnyCard,
} from '@/lib/types'

const FONT_OPTIONS = [
  ['sans', 'Moderni sans'],
  ['serif', 'Klassinen serif'],
  ['display', 'Display + sans'],
  ['condensed', 'Kapea condensed'],
] as const
const HEADING_OPTIONS = [
  ['uppercase', 'VERSAALI'],
  ['normal', 'Normaali'],
  ['smallcaps', 'Kapiteelit'],
] as const
const CARD_OPTIONS = [
  ['bold', 'Rohkea (väripalkki)'],
  ['minimal', 'Minimalistinen'],
  ['classic', 'Klassinen'],
] as const
const IMAGE_OPTIONS = [
  ['full-bleed', 'Koko leveys'],
  ['rounded', 'Pyöristetty'],
  ['circle', 'Ympyrä'],
  ['framed', 'Kehystetty'],
] as const

export default function BrandBuilder() {
  const { id } = useParams<{ id: string }>()
  const { db, reload } = useDb()
  const router = useRouter()
  const role = getRole()
  const [brand, setBrand] = useState<Brand>()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const b = db?.brands.find((x) => x.id === id)
    if (b && !brand) setBrand({ ...b })
  }, [db, id, brand])

  if (!db || !brand) return <Shell><p className="muted">Ladataan…</p></Shell>

  const sample: AnyCard =
    (db.products.find((p) => p.brandId === brand.id) as AnyCard) ??
    (db.misas.find((m) => m.brandId === brand.id) as AnyCard) ??
    ({
      id: 'sample',
      brandId: brand.id,
      kind: 'product',
      name: 'Esimerkkituote',
      category: 'Esikatselu',
      description: 'Tältä brändin tuotekortit näyttävät.',
      ingredients: [
        { name: 'Pääraaka-aine', amount: '120', unit: 'g' },
        { name: 'Kastike', amount: '25', unit: 'g' },
      ],
      instructions: 'Valmistusohje näkyy tässä.',
      allergens: ['gluten'],
      diets: [],
      version: '1.0',
      status: 'draft',
      updatedAt: new Date().toISOString(),
      updatedBy: '—',
      versions: [],
    } as AnyCard)

  const editable = can.editBrand(role)
  const patch = (p: Partial<Brand>) => {
    setBrand((b) => (b ? { ...b, ...p } : b))
    setSaved(false)
  }
  const patchColor = (key: keyof Brand['colors'], value: string) =>
    patch({ colors: { ...brand.colors, [key]: value } })

  const save = async () => {
    await api.saveBrand(brand)
    setSaved(true)
    reload()
  }

  const archive = async () => {
    if (!confirm(`Arkistoidaanko brändi ${brand.name}?`)) return
    await api.deleteBrand(brand.id)
    router.push('/brands')
  }

  return (
    <Shell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Brand Template Builder</p>
          <h1 className="h1">{brand.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/products?brand=${brand.id}`} className="btn-ghost">Brändin kortit</Link>
          {editable && (
            <>
              <button onClick={archive} className="btn-danger">Arkistoi</button>
              <button onClick={save} className="btn-primary">
                {saved ? '✓ Tallennettu' : 'Tallenna pohja'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="panel space-y-4 px-5 py-5">
            <label className="block">
              <span className="label">Brändin nimi</span>
              <input className="input" value={brand.name} onChange={(e) => patch({ name: e.target.value })} disabled={!editable} />
            </label>
            <label className="block">
              <span className="label">Slogan</span>
              <input className="input" value={brand.slogan ?? ''} onChange={(e) => patch({ slogan: e.target.value })} disabled={!editable} />
            </label>
            <label className="block">
              <span className="label">Footer-teksti</span>
              <input className="input" value={brand.footerText ?? ''} onChange={(e) => patch({ footerText: e.target.value })} disabled={!editable} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Pohjan versio</span>
                <input className="input" value={brand.version} onChange={(e) => patch({ version: e.target.value })} disabled={!editable} />
              </label>
              <label className="block">
                <span className="label">Oletuskorttipohja</span>
                <select
                  className="input"
                  value={brand.defaultTemplate}
                  onChange={(e) => patch({ defaultTemplate: e.target.value as TemplateKind })}
                  disabled={!editable}
                >
                  {brand.templates.map((t) => (
                    <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="panel space-y-4 px-5 py-5">
            <h3 className="text-sm font-bold">Värit</h3>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['primary', 'Päävari'],
                  ['secondary', 'Toissijainen'],
                  ['accent', 'Korostus'],
                  ['paper', 'Paperi/tausta'],
                  ['text', 'Teksti'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brand.colors[key]}
                    onChange={(e) => patchColor(key, e.target.value)}
                    disabled={!editable}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded border border-ink-700 bg-transparent"
                  />
                  <span className="text-xs text-ink-300">{label}<br /><code className="text-[10px] text-ink-500">{brand.colors[key]}</code></span>
                </label>
              ))}
            </div>
          </div>

          <div className="panel space-y-4 px-5 py-5">
            <h3 className="text-sm font-bold">Typografia & kortin tyyli</h3>
            {(
              [
                ['fontStyle', 'Fonttityyli', FONT_OPTIONS],
                ['headingStyle', 'Otsikkotyyli', HEADING_OPTIONS],
                ['cardStyle', 'Kortin tyyli', CARD_OPTIONS],
                ['imageStyle', 'Kuvien tyyli', IMAGE_OPTIONS],
              ] as const
            ).map(([key, label, options]) => (
              <label key={key} className="block">
                <span className="label">{label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {options.map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={!editable}
                      onClick={() => patch({ [key]: value } as Partial<Brand>)}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        brand[key] === value
                          ? 'border-brass bg-brass/15 text-brass-bright'
                          : 'border-ink-700 text-ink-400 hover:border-ink-500'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </label>
            ))}
          </div>

          <div className="panel space-y-4 px-5 py-5">
            <h3 className="text-sm font-bold">Korttipohjat käytössä</h3>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TEMPLATE_LABELS) as TemplateKind[]).map((t) => {
                const on = brand.templates.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!editable}
                    onClick={() =>
                      patch({
                        templates: on
                          ? brand.templates.filter((x) => x !== t)
                          : [...brand.templates, t],
                      })
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      on ? 'border-brass bg-brass/15 text-brass-bright' : 'border-ink-700 text-ink-400'
                    }`}
                  >
                    {TEMPLATE_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="panel px-5 py-5">
            <h3 className="mb-3 text-sm font-bold">Logo</h3>
            <ImageUploader
              url={brand.logoUrl}
              onChange={(v) => patch({ logoUrl: v.imageUrl })}
            />
          </div>
        </div>

        <div>
          <span className="label">Live-esikatselu · kaikki tämän brändin kortit näyttävät tältä</span>
          <div className="max-h-[85vh] overflow-auto rounded-xl border border-ink-800 bg-ink-850 p-5">
            <div style={{ zoom: 0.62 }}>
              <CardSheet card={sample} brand={brand} variant="product" />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
