'use client'
// Kortin renderöinti brändin visuaalisella pohjalla.
// Sama komponentti tuottaa esikatselun, printtinäkymän ja PDF:n sisällön,
// joten PDF näyttää aina samalta kuin esikatselu.
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { AnyCard, Brand, MisaCard, ProductCard } from '@/lib/types'
import { ALLERGENS, STATUS_LABELS } from '@/lib/types'
import { brandVars, contrastText } from '@/lib/brand-style'

export type SheetVariant = 'product' | 'kitchen' | 'misa' | 'compact' | 'showcase'

function useQr(url: string | null) {
  const [qr, setQr] = useState<string>()
  useEffect(() => {
    if (!url) return
    QRCode.toDataURL(url, { margin: 1, width: 160 }).then(setQr).catch(() => undefined)
  }, [url])
  return qr
}

function ImageBlock({ card, brand, tall }: { card: AnyCard; brand: Brand; tall?: boolean }) {
  const f = card.imageFocus ?? { x: 50, y: 50, zoom: 1 }
  if (card.imageUrl) {
    return (
      <div className={`b-img relative w-full overflow-hidden ${tall ? 'h-[64mm]' : 'h-[52mm]'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imageUrl}
          alt={card.name}
          className="h-full w-full object-cover"
          style={{
            objectPosition: `${f.x}% ${f.y}%`,
            transform: f.zoom !== 1 ? `scale(${f.zoom})` : undefined,
          }}
        />
      </div>
    )
  }
  // Tyylikäs placeholder: brändin väreillä, ei rikkinäisen näköinen
  return (
    <div
      className={`b-img flex w-full items-center justify-center ${tall ? 'h-[40mm]' : 'h-[30mm]'}`}
      style={{
        background: `linear-gradient(120deg, ${brand.colors.primary}, ${brand.colors.secondary})`,
      }}
    >
      <span
        className="b-heading text-2xl font-bold opacity-80"
        style={{ color: contrastText(brand.colors.primary) }}
      >
        {brand.name}
      </span>
    </div>
  )
}

function AllergenRow({ card }: { card: AnyCard }) {
  const items = ALLERGENS.filter((a) => card.allergens.includes(a.key))
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {card.allergensUnknown && (
        <span className="rounded border border-current px-2 py-0.5 text-[9pt] font-bold">
          ALLERGEENIT EI TIEDOSSA — VARMISTA
        </span>
      )}
      {items.map((a) => (
        <span
          key={a.key}
          className="rounded px-2 py-0.5 text-[8.5pt] font-semibold"
          style={{ background: 'var(--b-primary)', color: 'var(--b-paper)' }}
        >
          {a.label}
        </span>
      ))}
      {card.allergenOther && (
        <span className="rounded border border-current px-2 py-0.5 text-[8.5pt]">
          {card.allergenOther}
        </span>
      )}
      {!card.allergensUnknown && !items.length && !card.allergenOther && (
        <span className="text-[8.5pt] opacity-70">Ei merkittyjä allergeeneja</span>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="mb-3 break-inside-avoid">
      <div
        className="b-heading mb-1 border-b pb-0.5 text-[8.5pt] font-bold"
        style={{ borderColor: 'var(--b-secondary)', color: 'var(--b-primary)' }}
      >
        {title}
      </div>
      <div className="whitespace-pre-wrap text-[9.5pt] leading-snug">{children}</div>
    </div>
  )
}

function IngredientTable({ card, big }: { card: AnyCard; big?: boolean }) {
  if (!card.ingredients.length) return null
  return (
    <table className={`w-full ${big ? 'text-[10.5pt]' : 'text-[9.5pt]'}`}>
      <tbody>
        {card.ingredients.map((ing, i) => (
          <tr key={i} className="border-b" style={{ borderColor: 'color-mix(in srgb, var(--b-text) 14%, transparent)' }}>
            <td className="py-0.5 pr-2">{ing.name}</td>
            <td className="whitespace-nowrap py-0.5 text-right font-semibold tabular-nums">
              {ing.amount} {ing.unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Footer({ brand, card, qr }: { brand: Brand; card: AnyCard; qr?: string }) {
  return (
    <div
      className="mt-auto flex items-end justify-between gap-4 border-t pt-2"
      style={{ borderColor: 'var(--b-secondary)' }}
    >
      <div className="text-[7.5pt] leading-tight opacity-80">
        <div>{brand.footerText ?? brand.name}</div>
        <div className="mt-0.5">
          Versio {card.version} · {STATUS_LABELS[card.status]} · Muokattu{' '}
          {new Date(card.updatedAt).toLocaleDateString('fi-FI')}
          {'owner' in card && card.owner ? ` · Vastuu: ${card.owner}` : ''}
          {'approver' in card && (card as ProductCard).approver
            ? ` · Hyväksynyt: ${(card as ProductCard).approver}`
            : ''}
        </div>
      </div>
      {qr && (
        <div className="shrink-0 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR" className="h-[16mm] w-[16mm]" />
          <div className="text-[6pt] opacity-60">Digitaalinen kortti</div>
        </div>
      )}
    </div>
  )
}

export default function CardSheet({
  card,
  brand,
  variant,
  className = '',
}: {
  card: AnyCard
  brand: Brand
  variant: SheetVariant
  className?: string
}) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/${card.kind === 'misa' ? 'misas' : 'products'}/${card.id}`
    : null
  const qr = useQr(url)
  const vars = brandVars(brand)
  const p = card as ProductCard
  const m = card as MisaCard
  const bold = brand.cardStyle === 'bold'
  const headerBg = bold ? brand.colors.primary : 'transparent'
  const headerColor = bold ? contrastText(brand.colors.primary) : brand.colors.text

  return (
    <div
      className={`card-sheet print-page relative mx-auto flex w-[210mm] min-h-[296mm] flex-col shadow-pop ${className}`}
      style={vars}
    >
      {/* ── Ylätunniste ── */}
      <div
        className="flex items-center justify-between px-[14mm] pb-4 pt-[10mm]"
        style={{ background: headerBg, color: headerColor }}
      >
        <div className="flex items-center gap-4">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} className="h-[12mm] w-auto object-contain" />
          ) : (
            <div
              className="b-heading flex h-[12mm] items-center border-2 px-3 text-[13pt] font-bold"
              style={{ borderColor: bold ? headerColor : 'var(--b-primary)' }}
            >
              {brand.name}
            </div>
          )}
          <div>
            <div className="text-[8pt] uppercase tracking-[0.2em] opacity-70">
              {variant === 'misa'
                ? 'Misa · esivalmiste'
                : variant === 'kitchen'
                  ? 'Keittiöohje'
                  : p.category ?? 'Tuotekortti'}
            </div>
            {brand.slogan && variant !== 'kitchen' && (
              <div className="text-[8pt] italic opacity-70">{brand.slogan}</div>
            )}
          </div>
        </div>
        <div className="text-right text-[8pt] opacity-80">
          <div>v{card.version}</div>
          <div>{new Date(card.updatedAt).toLocaleDateString('fi-FI')}</div>
        </div>
      </div>

      {/* ── Nimi ── */}
      <div className="px-[14mm] pt-4">
        <h1
          className="b-heading text-[26pt] font-bold leading-none"
          style={{ color: 'var(--b-primary)' }}
        >
          {card.name}
        </h1>
        {'description' in card && p.description && variant !== 'kitchen' && (
          <p className="mt-2 max-w-[150mm] text-[10.5pt] italic leading-snug opacity-85">
            {p.description}
          </p>
        )}
        {card.kind === 'misa' && m.usedIn && (
          <p className="mt-1 text-[9.5pt]">
            <b>Käyttö:</b> {m.usedIn}
          </p>
        )}
      </div>

      {/* ── Kuva ── */}
      {variant !== 'kitchen' && variant !== 'compact' && (
        <div className={brand.imageStyle === 'full-bleed' ? 'mt-4' : 'mt-4 px-[14mm]'}>
          <ImageBlock card={card} brand={brand} tall={variant === 'showcase'} />
        </div>
      )}

      {/* ── Sisältö ── */}
      <div className="grid flex-1 grid-cols-5 gap-x-6 px-[14mm] pt-4">
        <div className="col-span-2">
          {card.kind === 'product' && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {[
                ['Annoskoko', p.portionSize],
                ['Annospaino', p.portionWeight],
                ['Hinta', p.price],
                ['RA-kustannus', p.cost],
                p.price && p.cost
                  ? ['Kate', marginPct(p.price, p.cost)]
                  : null,
                ['Valmistusaika', p.prepTime],
              ]
                .filter((x): x is [string, string] => Boolean(x && x[1]))
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded px-2 py-1.5"
                    style={{ background: 'color-mix(in srgb, var(--b-secondary) 14%, transparent)' }}
                  >
                    <div className="text-[7pt] uppercase tracking-wider opacity-70">{k}</div>
                    <div className="text-[10pt] font-bold">{v}</div>
                  </div>
                ))}
            </div>
          )}
          {card.kind === 'misa' && (
            <div className="mb-3 space-y-1.5 text-[9.5pt]">
              {m.yieldAmount && <div><b>Valmistusmäärä:</b> {m.yieldAmount}</div>}
              {m.container && <div><b>Astia:</b> {m.container}</div>}
              {m.storageTemp && <div><b>Lämpötila:</b> {m.storageTemp}</div>}
              {m.shelfLife && <div><b>Säilyvyys:</b> {m.shelfLife}</div>}
              {m.dating && <div><b>Päiväys:</b> {m.dating}</div>}
              {m.dosing && <div><b>Annostelu:</b> {m.dosing}</div>}
            </div>
          )}
          <Section title="Raaka-aineet">
            <IngredientTable card={card} big={variant === 'misa' || variant === 'kitchen'} />
          </Section>
          {card.kind === 'product' && (
            <>
              <Section title="Välineet">{p.equipment}</Section>
              <Section title="Esivalmistelut">{p.preps}</Section>
            </>
          )}
        </div>

        <div className="col-span-3">
          <Section title="Valmistus">{card.instructions}</Section>
          {card.kind === 'product' && (
            <>
              <Section title="Kasaus">{p.assembly}</Section>
              <Section title="Tarjoilu">{p.serving}</Section>
              <Section title="Säilytys & lämpötilat">
                {[p.storage, p.shelfLife && `Säilyvyys: ${p.shelfLife}`, p.temperatures]
                  .filter(Boolean)
                  .join('\n') || undefined}
              </Section>
              {p.warnings && (
                <div
                  className="mb-3 rounded border-l-4 px-3 py-2 text-[9.5pt] font-semibold"
                  style={{
                    borderColor: 'var(--b-accent)',
                    background: 'color-mix(in srgb, var(--b-accent) 12%, transparent)',
                  }}
                >
                  ⚠ {p.warnings}
                </div>
              )}
              {p.diets.length > 0 && (
                <div className="mb-3 flex gap-1.5">
                  {p.diets.map((d) => (
                    <span
                      key={d}
                      className="rounded-full border px-2 py-0.5 text-[8.5pt] font-bold"
                      style={{ borderColor: 'var(--b-primary)', color: 'var(--b-primary)' }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          <Section title="Allergeenit">
            <AllergenRow card={card} />
          </Section>
        </div>
      </div>

      <div className="px-[14mm] pb-[10mm]">
        <Footer brand={brand} card={card} qr={qr} />
      </div>
    </div>
  )
}

function marginPct(price: string, cost: string): string {
  const p = parseFloat(price.replace(',', '.'))
  const c = parseFloat(cost.replace(',', '.'))
  if (!p || !c) return '—'
  const vatless = p / 1.14
  return Math.round(((vatless - c) / vatless) * 100) + ' %'
}
