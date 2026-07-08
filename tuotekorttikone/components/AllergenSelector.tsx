'use client'
import { ALLERGENS } from '@/lib/types'

export default function AllergenSelector({
  value,
  other,
  unknown,
  onChange,
}: {
  value: string[]
  other?: string
  unknown?: boolean
  onChange: (v: { allergens: string[]; allergenOther?: string; allergensUnknown?: boolean }) => void
}) {
  const toggle = (key: string) => {
    const next = value.includes(key) ? value.filter((k) => k !== key) : [...value, key]
    onChange({ allergens: next, allergenOther: other, allergensUnknown: false })
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ALLERGENS.map((a) => {
          const on = value.includes(a.key)
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => toggle(a.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                on
                  ? 'border-brass bg-brass/20 text-brass-bright'
                  : 'border-ink-700 text-ink-400 hover:border-ink-500'
              }`}
            >
              {a.label}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          className="input flex-1"
          placeholder="Muut huomioitavat allergeenit…"
          value={other ?? ''}
          onChange={(e) =>
            onChange({ allergens: value, allergenOther: e.target.value, allergensUnknown: unknown })
          }
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-ink-400">
          <input
            type="checkbox"
            checked={unknown ?? false}
            onChange={(e) =>
              onChange({ allergens: e.target.checked ? [] : value, allergenOther: other, allergensUnknown: e.target.checked })
            }
          />
          Ei tiedossa
        </label>
      </div>
    </div>
  )
}
