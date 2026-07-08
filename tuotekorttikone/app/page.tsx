'use client'
import Link from 'next/link'
import Shell from '@/components/Shell'
import StatusBadge from '@/components/StatusBadge'
import { useDb } from '@/lib/useDb'
import { missingFields } from '@/lib/parser'
import type { AnyCard } from '@/lib/types'

export default function Dashboard() {
  const { db } = useDb()
  if (!db) return <Shell><p className="muted">Ladataan…</p></Shell>

  const cards: AnyCard[] = [...db.products, ...db.misas]
  const active = cards.filter((c) => c.status !== 'archived')
  const pending = active.filter((c) => c.status === 'review')
  const incomplete = active.filter(
    (c) => missingFields(c as unknown as Record<string, unknown>).some((m) => m.critical),
  )
  const recent = [...active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)
  const printable = active.filter((c) => c.status === 'approved').slice(0, 6)

  return (
    <Shell>
      <header className="mb-8">
        <h1 className="h1">Dashboard</h1>
        <p className="muted mt-1">Brändien tuotekortit, misat ja printit yhdestä paikasta.</p>
      </header>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {db.brands.filter((b) => !b.archived).map((b) => {
          const count = active.filter((c) => c.brandId === b.id).length
          return (
            <Link key={b.id} href={`/brands/${b.id}`} className="panel group px-5 py-4 transition hover:border-brass/50">
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black"
                  style={{ background: b.colors.primary, color: b.colors.paper }}
                >
                  {b.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-display text-3xl font-semibold">{count}</span>
              </div>
              <div className="mt-3 font-semibold group-hover:text-brass-bright">{b.name}</div>
              <div className="text-xs text-ink-500">korttia järjestelmässä</div>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel px-5 py-5">
          <h2 className="h2 mb-4">Odottaa hyväksyntää <span className="text-brass">{pending.length}</span></h2>
          <CardList cards={pending} empty="Ei kortteja tarkistettavana." />
        </section>
        <section className="panel px-5 py-5">
          <h2 className="h2 mb-4">Puutteelliset kortit <span className="text-amber-400">{incomplete.length}</span></h2>
          <CardList cards={incomplete.slice(0, 6)} empty="Kaikissa korteissa on kriittiset tiedot." />
        </section>
        <section className="panel px-5 py-5">
          <h2 className="h2 mb-4">Viimeksi muokatut</h2>
          <CardList cards={recent} empty="Ei kortteja vielä." showDate />
        </section>
        <section className="panel px-5 py-5">
          <h2 className="h2 mb-4">Valmiina printtiin</h2>
          <CardList
            cards={printable}
            empty="Ei hyväksyttyjä kortteja."
            action={(c) => (
              <Link
                href={`/print/card/${c.id}?variant=${c.kind === 'misa' ? 'misa' : 'kitchen'}`}
                target="_blank"
                className="btn-ghost text-xs"
              >
                Printtaa
              </Link>
            )}
          />
        </section>
      </div>
    </Shell>
  )
}

function CardList({
  cards,
  empty,
  showDate,
  action,
}: {
  cards: AnyCard[]
  empty: string
  showDate?: boolean
  action?: (c: AnyCard) => React.ReactNode
}) {
  if (!cards.length) return <p className="text-sm text-ink-500">{empty}</p>
  return (
    <ul className="divide-y divide-ink-800">
      {cards.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
          <Link
            href={`/${c.kind === 'misa' ? 'misas' : 'products'}/${c.id}`}
            className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brass-bright"
          >
            {c.name}
            <span className="ml-2 text-xs text-ink-500">{c.kind === 'misa' ? 'misa' : 'tuote'}</span>
          </Link>
          {showDate && (
            <span className="text-xs text-ink-500">
              {new Date(c.updatedAt).toLocaleDateString('fi-FI')}
            </span>
          )}
          <StatusBadge status={c.status} />
          {action?.(c)}
        </li>
      ))}
    </ul>
  )
}
