'use client'
import Shell from '@/components/Shell'
import { useDb } from '@/lib/useDb'

export default function SettingsPage() {
  const { db } = useDb()
  return (
    <Shell>
      <header className="mb-6">
        <h1 className="h1">Asetukset</h1>
        <p className="muted mt-1">Ympäristö, integraatiot ja audit-loki.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel px-5 py-5">
          <h2 className="h2 mb-3">Ympäristö</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Tietokanta</dt>
              <dd>Demo-tila (paikallinen .data/db.json)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Supabase</dt>
              <dd>Kytketään .env-tiedostolla — ks. README ja supabase/schema.sql</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">LLM-jäsennys</dt>
              <dd>LLM_PROVIDER + API-avain .env-tiedostoon</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">PDF-moottori</dt>
              <dd>PDF_CHROME_PATH tai <code className="text-xs">npx playwright install chromium</code></dd>
            </div>
          </dl>
        </section>

        <section className="panel px-5 py-5">
          <h2 className="h2 mb-3">Audit-loki</h2>
          <ul className="max-h-96 space-y-1.5 overflow-auto text-xs">
            {db?.audit.slice(0, 60).map((a) => (
              <li key={a.id} className="flex gap-3 border-b border-ink-800/60 pb-1.5">
                <span className="w-32 shrink-0 text-ink-500">
                  {new Date(a.at).toLocaleString('fi-FI')}
                </span>
                <span className="w-14 shrink-0 font-semibold text-brass">{a.by}</span>
                <span className="w-28 shrink-0 text-ink-400">{a.action}</span>
                <span className="min-w-0 flex-1 truncate">{a.detail ?? a.target}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  )
}
