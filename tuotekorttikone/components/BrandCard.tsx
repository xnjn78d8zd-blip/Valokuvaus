'use client'
import Link from 'next/link'
import type { Brand } from '@/lib/types'

export default function BrandCard({ brand, cardCount }: { brand: Brand; cardCount: number }) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="panel group block overflow-hidden transition hover:border-brass/60"
    >
      <div
        className="flex h-28 items-center justify-center"
        style={{
          background: `linear-gradient(120deg, ${brand.colors.primary} 60%, ${brand.colors.secondary})`,
        }}
      >
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt={brand.name} className="max-h-14 object-contain" />
        ) : (
          <span
            className="text-2xl font-black tracking-wide"
            style={{ color: brand.colors.paper, fontFamily: brand.fontStyle === 'display' ? 'var(--font-display)' : undefined }}
          >
            {brand.name}
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold group-hover:text-brass-bright">{brand.name}</h3>
          <span className="text-xs text-ink-500">{cardCount} korttia</span>
        </div>
        {brand.slogan && <p className="mt-1 text-xs italic text-ink-400">{brand.slogan}</p>}
        <div className="mt-3 flex gap-1.5">
          {Object.values(brand.colors).map((c, i) => (
            <span key={i} className="h-4 w-4 rounded-full border border-white/10" style={{ background: c }} />
          ))}
        </div>
      </div>
    </Link>
  )
}
