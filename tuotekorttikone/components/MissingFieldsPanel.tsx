'use client'
import type { MissingField } from '@/lib/parser'

export default function MissingFieldsPanel({
  missing,
  notApplicable,
  onSkip,
  onFocus,
}: {
  missing: MissingField[]
  notApplicable: string[]
  onSkip: (key: string) => void
  onFocus?: (key: string) => void
}) {
  const open = missing.filter((m) => !notApplicable.includes(m.key))
  if (!open.length) {
    return (
      <div className="panel border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
        ✓ Kaikki oleelliset tiedot on täytetty tai kuitattu.
      </div>
    )
  }
  return (
    <div className="panel border-amber-800/50 px-4 py-4">
      <h3 className="mb-2 text-sm font-bold text-amber-300">
        Puuttuvat tiedot ennen valmista korttia:
      </h3>
      <ul className="space-y-1.5">
        {open.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={() => onFocus?.(m.key)}
              className={`text-left hover:underline ${m.critical ? 'font-semibold text-amber-200' : 'text-ink-300'}`}
            >
              {m.critical ? '● ' : '○ '}
              {m.label}
              {m.critical && <span className="ml-2 text-[10px] uppercase text-amber-500">kriittinen</span>}
            </button>
            {!m.critical && (
              <button
                type="button"
                onClick={() => onSkip(m.key)}
                className="shrink-0 text-xs text-ink-500 hover:text-ink-300"
              >
                Ei koske tätä tuotetta
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
