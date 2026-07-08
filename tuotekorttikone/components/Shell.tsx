'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getRole, setRole } from '@/lib/api'
import type { Role } from '@/lib/types'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/brands', label: 'Brändit' },
  { href: '/products', label: 'Tuotekortit' },
  { href: '/misas', label: 'Misat' },
  { href: '/import', label: 'Smart Import' },
  { href: '/templates', label: 'Templates' },
  { href: '/allergens', label: 'Allergeenit' },
  { href: '/export', label: 'Export / Print' },
  { href: '/settings', label: 'Asetukset' },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [role, setRoleState] = useState<Role>('admin')
  const [light, setLight] = useState(false)

  useEffect(() => {
    setRoleState(getRole())
    const saved = localStorage.getItem('tk_theme') === 'light'
    setLight(saved)
    document.documentElement.classList.toggle('light', saved)
  }, [])

  const toggleTheme = () => {
    const next = !light
    setLight(next)
    document.documentElement.classList.toggle('light', next)
    localStorage.setItem('tk_theme', next ? 'light' : 'dark')
  }

  const changeRole = (r: Role) => {
    setRole(r)
    setRoleState(r)
    location.reload()
  }

  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-900/60 px-4 py-6 backdrop-blur">
        <Link href="/" className="mb-8 block px-2">
          <span className="font-display text-xl font-bold tracking-tight">
            Tuotekortti<span className="text-brass">kone</span>
          </span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.25em] text-ink-500">
            Brand kitchen tools
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brass/15 text-brass-bright'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-6 space-y-3 border-t border-ink-800 pt-4">
          <div>
            <span className="label">Rooli</span>
            <select
              value={role}
              onChange={(e) => changeRole(e.target.value as Role)}
              className="input"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer / Kitchen</option>
            </select>
          </div>
          <button onClick={toggleTheme} className="btn-ghost w-full justify-center">
            {light ? 'Tumma tila' : 'Vaalea tila'}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8 md:px-12">{children}</main>
    </div>
  )
}
