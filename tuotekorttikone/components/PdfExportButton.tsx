'use client'
import { useState } from 'react'

export default function PdfExportButton({
  printUrl,
  landscape,
  label = 'Lataa PDF',
}: {
  printUrl: string
  landscape?: boolean
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string>()

  const download = async () => {
    setBusy(true)
    setNote(undefined)
    try {
      const res = await fetch(`/api/pdf?url=${encodeURIComponent(printUrl)}${landscape ? '&landscape=1' : ''}`)
      if (res.status === 501) {
        // Ei PDF-moottoria → avaa printtinäkymä, selaimen "Tallenna PDF" hoitaa
        setNote('PDF-moottoria ei ole asennettu — avattiin printtinäkymä (Tulosta → Tallenna PDF).')
        window.open(printUrl, '_blank')
        return
      }
      if (!res.ok) throw new Error('PDF-vienti epäonnistui')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'tuotekortti.pdf'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Virhe')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button onClick={download} disabled={busy} className="btn-primary">
        {busy ? 'Viedään…' : label}
      </button>
      {note && <span className="mt-1 max-w-56 text-[11px] text-ink-400">{note}</span>}
    </span>
  )
}
