'use client'
import type { VersionEntry } from '@/lib/types'

export default function VersionHistory({
  current,
  versions,
  onRestore,
}: {
  current: { version: string; updatedAt: string; updatedBy: string }
  versions: VersionEntry[]
  onRestore?: (v: VersionEntry) => void
}) {
  return (
    <div className="panel px-4 py-4">
      <h3 className="mb-3 text-sm font-bold">Versiohistoria</h3>
      <ol className="space-y-2 text-sm">
        <li className="flex items-center justify-between rounded-lg bg-brass/10 px-3 py-2">
          <div>
            <b>v{current.version}</b> <span className="text-brass">· nykyinen</span>
            <div className="text-xs text-ink-400">
              {new Date(current.updatedAt).toLocaleString('fi-FI')} · {current.updatedBy}
            </div>
          </div>
        </li>
        {versions.map((v, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-ink-800/50">
            <div>
              <b>v{v.version}</b>
              <div className="text-xs text-ink-400">
                {new Date(v.savedAt).toLocaleString('fi-FI')} · {v.savedBy}
                {v.changed?.length ? ` · muutettu: ${v.changed.join(', ')}` : ''}
              </div>
            </div>
            {onRestore && (
              <button onClick={() => onRestore(v)} className="btn-ghost text-xs">
                Palauta
              </button>
            )}
          </li>
        ))}
        {!versions.length && <li className="text-xs text-ink-500">Ei aiempia versioita.</li>}
      </ol>
    </div>
  )
}
