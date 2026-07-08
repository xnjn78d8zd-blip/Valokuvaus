'use client'
// Yhteinen lomakeydin tuote- ja misakorteille.
// ProductForm ja MisaForm ovat ohuita kääreitä tämän ympärillä.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnyCard, Brand, Ingredient, MisaCard, ProductCard } from '@/lib/types'
import { DIETS } from '@/lib/types'
import { api, can, getRole } from '@/lib/api'
import { missingFields } from '@/lib/parser'
import { validateForApproval } from '@/lib/validate'
import AllergenSelector from './AllergenSelector'
import ImageUploader from './ImageUploader'
import MissingFieldsPanel from './MissingFieldsPanel'
import CardSheet from './CardSheet'

function Field({
  label,
  children,
  id,
}: {
  label: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <label className="block" id={id ? `field-${id}` : undefined}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

function IngredientEditor({
  value,
  onChange,
}: {
  value: Ingredient[]
  onChange: (v: Ingredient[]) => void
}) {
  const set = (i: number, patch: Partial<Ingredient>) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  return (
    <div className="space-y-1.5">
      {value.map((row, i) => (
        <div key={i} className="flex gap-1.5">
          <input
            className="input min-w-0 flex-1"
            placeholder="Raaka-aine"
            value={row.name}
            onChange={(e) => set(i, { name: e.target.value })}
          />
          <input
            className="input"
            style={{ width: '5.5rem', flex: '0 0 auto' }}
            placeholder="Määrä"
            value={row.amount}
            onChange={(e) => set(i, { amount: e.target.value })}
          />
          <select
            className="input"
            style={{ width: '5rem', flex: '0 0 auto' }}
            value={row.unit}
            onChange={(e) => set(i, { unit: e.target.value })}
          >
            {['', 'g', 'kg', 'ml', 'dl', 'l', 'kpl', '%', 'rkl', 'tl'].map((u) => (
              <option key={u} value={u}>
                {u || '—'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="rounded px-2 text-ink-500 hover:text-red-400"
            aria-label="Poista rivi"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { name: '', amount: '', unit: 'g' }])}
        className="btn-ghost text-xs"
      >
        + Lisää raaka-aine
      </button>
    </div>
  )
}

export default function CardForm({
  kind,
  brands,
  initial,
  gallery = [],
}: {
  kind: 'product' | 'misa'
  brands: Brand[]
  initial?: Partial<AnyCard>
  gallery?: string[]
}) {
  const router = useRouter()
  const role = getRole()
  const [card, setCard] = useState<Partial<AnyCard>>(() => ({
    kind,
    brandId: brands[0]?.id,
    ingredients: [],
    allergens: [],
    diets: [],
    version: '1.0',
    status: 'draft',
    notApplicable: [],
    ...initial,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [note, setNote] = useState('')

  const brand = brands.find((b) => b.id === card.brandId) ?? brands[0]
  const missing = useMemo(() => missingFields(card as Record<string, unknown>), [card])
  const approvalErrors = useMemo(() => validateForApproval(card), [card])

  const patch = (p: Record<string, unknown>) =>
    setCard((c) => ({ ...c, ...p }) as Partial<AnyCard>)

  const save = async (status?: AnyCard['status']) => {
    setSaving(true)
    setError(undefined)
    try {
      const saved = await api.saveCard(
        { ...card, status: status ?? card.status },
        { note: note || undefined },
      )
      router.push(`/${kind === 'misa' ? 'misas' : 'products'}/${saved.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  const p = card as Partial<ProductCard>
  const m = card as Partial<MisaCard>
  const editable = can.editCard(role)

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brändi *">
            <select
              className="input"
              value={card.brandId}
              onChange={(e) => patch({ brandId: e.target.value })}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={kind === 'misa' ? 'Misan nimi *' : 'Tuotteen nimi *'} id="name">
            <input
              className="input"
              value={card.name ?? ''}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={kind === 'misa' ? 'esim. DF-majoneesi' : 'esim. Hot Honey Burger'}
            />
          </Field>
        </div>

        {kind === 'product' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kategoria">
                <input className="input" value={p.category ?? ''} onChange={(e) => patch({ category: e.target.value })} />
              </Field>
              <Field label="Versionumero *">
                <input className="input" value={card.version ?? ''} onChange={(e) => patch({ version: e.target.value })} />
              </Field>
            </div>
            <Field label="Lyhyt kuvaus">
              <textarea
                className="input min-h-16"
                value={p.description ?? ''}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Annoskoko" id="portionSize">
                <input className="input" value={p.portionSize ?? ''} onChange={(e) => patch({ portionSize: e.target.value })} />
              </Field>
              <Field label="Annospaino">
                <input className="input" value={p.portionWeight ?? ''} onChange={(e) => patch({ portionWeight: e.target.value })} />
              </Field>
              <Field label="Myyntihinta" id="price">
                <input className="input" value={p.price ?? ''} onChange={(e) => patch({ price: e.target.value })} placeholder="14,90 €" />
              </Field>
              <Field label="RA-kustannus">
                <input className="input" value={p.cost ?? ''} onChange={(e) => patch({ cost: e.target.value })} placeholder="3,85 €" />
              </Field>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mihin tuotteisiin käytetään">
                <input className="input" value={m.usedIn ?? ''} onChange={(e) => patch({ usedIn: e.target.value })} />
              </Field>
              <Field label="Valmistusmäärä" id="yieldAmount">
                <input className="input" value={m.yieldAmount ?? ''} onChange={(e) => patch({ yieldAmount: e.target.value })} placeholder="esim. 3 kg" />
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Säilytysastia" id="container">
                <input className="input" value={m.container ?? ''} onChange={(e) => patch({ container: e.target.value })} placeholder="GN 1/3" />
              </Field>
              <Field label="Lämpötila" id="storageTemp">
                <input className="input" value={m.storageTemp ?? ''} onChange={(e) => patch({ storageTemp: e.target.value })} placeholder="+2…+4 °C" />
              </Field>
              <Field label="Säilyvyys" id="shelfLife">
                <input className="input" value={m.shelfLife ?? ''} onChange={(e) => patch({ shelfLife: e.target.value })} placeholder="3 vrk" />
              </Field>
              <Field label="Versionumero *">
                <input className="input" value={card.version ?? ''} onChange={(e) => patch({ version: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Päiväystapa">
                <input className="input" value={m.dating ?? ''} onChange={(e) => patch({ dating: e.target.value })} />
              </Field>
              <Field label="Annosteluohje" id="dosing">
                <input className="input" value={m.dosing ?? ''} onChange={(e) => patch({ dosing: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        <Field label="Raaka-aineet">
          <IngredientEditor
            value={card.ingredients ?? []}
            onChange={(ingredients) => patch({ ingredients })}
          />
        </Field>

        <Field label="Valmistusohje" id="instructions">
          <textarea
            className="input min-h-24"
            value={card.instructions ?? ''}
            onChange={(e) => patch({ instructions: e.target.value })}
          />
        </Field>

        {kind === 'product' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kasausohje">
                <textarea className="input min-h-20" value={p.assembly ?? ''} onChange={(e) => patch({ assembly: e.target.value })} />
              </Field>
              <Field label="Tarjoiluohje">
                <textarea className="input min-h-20" value={p.serving ?? ''} onChange={(e) => patch({ serving: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Säilytysohje">
                <input className="input" value={p.storage ?? ''} onChange={(e) => patch({ storage: e.target.value })} />
              </Field>
              <Field label="Säilyvyys" id="shelfLife">
                <input className="input" value={p.shelfLife ?? ''} onChange={(e) => patch({ shelfLife: e.target.value })} />
              </Field>
              <Field label="Lämpötilat">
                <input className="input" value={p.temperatures ?? ''} onChange={(e) => patch({ temperatures: e.target.value })} placeholder="Paisto 175 °C" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Valmistusaika">
                <input className="input" value={p.prepTime ?? ''} onChange={(e) => patch({ prepTime: e.target.value })} />
              </Field>
              <Field label="Esivalmistelut">
                <input className="input" value={p.preps ?? ''} onChange={(e) => patch({ preps: e.target.value })} />
              </Field>
              <Field label="Tarvittavat välineet">
                <input className="input" value={p.equipment ?? ''} onChange={(e) => patch({ equipment: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ruokavaliomerkinnät">
                <div className="flex gap-1.5 pt-1">
                  {DIETS.map((d) => {
                    const on = p.diets?.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          patch({
                            diets: on ? p.diets!.filter((x) => x !== d) : [...(p.diets ?? []), d],
                          })
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          on ? 'border-brass bg-brass/20 text-brass-bright' : 'border-ink-700 text-ink-400'
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field label="Varoitukset">
                <input className="input" value={p.warnings ?? ''} onChange={(e) => patch({ warnings: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        <Field label="Allergeenit *" id="allergens">
          <AllergenSelector
            value={card.allergens ?? []}
            other={card.allergenOther}
            unknown={card.allergensUnknown}
            onChange={(v) => patch(v)}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Vastuuhenkilö">
            <input className="input" value={card.owner ?? ''} onChange={(e) => patch({ owner: e.target.value })} />
          </Field>
          {kind === 'product' && (
            <Field label="Hyväksyjä" id="approver">
              <input className="input" value={p.approver ?? ''} onChange={(e) => patch({ approver: e.target.value })} />
            </Field>
          )}
          <Field label="Sisäinen huomio">
            <input
              className="input"
              value={(card as Partial<ProductCard>).internalNote ?? ''}
              onChange={(e) => patch({ internalNote: e.target.value })}
            />
          </Field>
        </div>

        <Field label={kind === 'misa' ? 'Kuva valmiista misasta' : 'Annoskuva'} id="imageUrl">
          <ImageUploader
            url={card.imageUrl}
            focus={card.imageFocus}
            gallery={gallery}
            onChange={(v) => patch(v)}
          />
        </Field>

        <MissingFieldsPanel
          missing={missing}
          notApplicable={card.notApplicable ?? []}
          onSkip={(key) => patch({ notApplicable: [...(card.notApplicable ?? []), key] })}
          onFocus={(key) =>
            document.getElementById(`field-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        />

        {error && <p className="rounded-lg bg-red-950/50 px-4 py-2 text-sm text-red-300">{error}</p>}

        {editable && (
          <div className="flex flex-wrap items-center gap-3 border-t border-ink-800 pt-5">
            <input
              className="input max-w-56"
              placeholder="Muutosviesti versiohistoriaan…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button onClick={() => save('draft')} disabled={saving} className="btn-ghost">
              Tallenna luonnos
            </button>
            <button onClick={() => save('review')} disabled={saving} className="btn-ghost">
              Lähetä tarkistettavaksi
            </button>
            {can.approve(role) && (
              <button
                onClick={() => save('approved')}
                disabled={saving || approvalErrors.length > 0}
                title={approvalErrors.map((e) => e.message).join('\n')}
                className="btn-primary"
              >
                Hyväksy {approvalErrors.length > 0 && `(${approvalErrors.length} puutetta)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Reaaliaikainen brändiesikatselu ── */}
      <div className="no-print">
        <span className="label">Esikatselu · {brand?.name}</span>
        <div className="max-h-[80vh] overflow-auto rounded-xl border border-ink-800 bg-ink-850 p-4">
          <div style={{ zoom: 0.55 }}>
            {brand && (
              <CardSheet
                card={card as AnyCard}
                brand={brand}
                variant={kind === 'misa' ? 'misa' : 'product'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductForm(props: { brands: Brand[]; initial?: Partial<AnyCard>; gallery?: string[] }) {
  return <CardForm kind="product" {...props} />
}
export function MisaForm(props: { brands: Brand[]; initial?: Partial<AnyCard>; gallery?: string[] }) {
  return <CardForm kind="misa" {...props} />
}
