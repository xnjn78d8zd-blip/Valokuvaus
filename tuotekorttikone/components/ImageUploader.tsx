'use client'
// Kuvan upload + esikatselu + rajaus (polttopiste ja zoom).
import { useRef, useState } from 'react'
import { api } from '@/lib/api'

export default function ImageUploader({
  url,
  focus,
  gallery = [],
  onChange,
}: {
  url?: string
  focus?: { x: number; y: number; zoom: number }
  gallery?: string[]
  onChange: (v: { imageUrl?: string; imageFocus?: { x: number; y: number; zoom: number } }) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const f = focus ?? { x: 50, y: 50, zoom: 1 }

  const upload = async (file: File) => {
    setBusy(true)
    setError(undefined)
    try {
      const { url: newUrl } = await api.upload(file)
      onChange({ imageUrl: newUrl, imageFocus: { x: 50, y: 50, zoom: 1 } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lataus epäonnistui')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {url ? (
        <div className="relative h-44 overflow-hidden rounded-xl border border-ink-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: `${f.x}% ${f.y}%`, transform: `scale(${f.zoom})` }}
          />
          <button
            type="button"
            onClick={() => onChange({ imageUrl: undefined, imageFocus: undefined })}
            className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white hover:bg-red-700"
          >
            Poista
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-ink-700 text-sm text-ink-400 transition hover:border-brass hover:text-brass"
        >
          {busy ? 'Ladataan…' : '+ Lisää kuva (tai jätä tyhjäksi — placeholder hoitaa loput)'}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {url && (
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['Vaaka', 'x'],
              ['Pysty', 'y'],
              ['Zoom', 'zoom'],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="block">
              <span className="label">{label}</span>
              <input
                type="range"
                min={key === 'zoom' ? 1 : 0}
                max={key === 'zoom' ? 2 : 100}
                step={key === 'zoom' ? 0.05 : 1}
                value={f[key]}
                onChange={(e) =>
                  onChange({ imageUrl: url, imageFocus: { ...f, [key]: Number(e.target.value) } })
                }
                className="w-full accent-[#c9a15a]"
              />
            </label>
          ))}
        </div>
      )}
      {url && (
        <div className="flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost text-xs">
            Vaihda kuva
          </button>
        </div>
      )}
      {gallery.length > 0 && (
        <div>
          <span className="label">Brändin kuvapankki</span>
          <div className="flex flex-wrap gap-2">
            {gallery.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ imageUrl: g, imageFocus: { x: 50, y: 50, zoom: 1 } })}
                className={`h-14 w-14 overflow-hidden rounded-lg border ${g === url ? 'border-brass' : 'border-ink-700'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
