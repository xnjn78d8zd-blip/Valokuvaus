'use client'
// Selainpuolen ohut API-kerros.
import type { AnyCard, Brand, Database, MisaCard, ProductCard, Role } from './types'

async function req<T>(method: string, body?: unknown, qs = ''): Promise<T> {
  const res = await fetch('/api/data' + qs, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText)
  return res.json() as Promise<T>
}

export const api = {
  db: () => req<Database>('GET'),
  saveBrand: (brand: Partial<Brand>) => req<Brand>('POST', { entity: 'brand', data: brand }),
  deleteBrand: (id: string) => req<{ ok: true }>('POST', { entity: 'brand', delete: id }),
  saveCard: (card: Partial<AnyCard>, opts?: { note?: string }) =>
    req<ProductCard | MisaCard>('POST', { entity: 'card', data: card, note: opts?.note }),
  deleteCard: (id: string) => req<{ ok: true }>('POST', { entity: 'card', delete: id }),
  parse: async (raw: string) => {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    })
    if (!res.ok) throw new Error('Jäsennys epäonnistui')
    return res.json() as Promise<{ parsed: import('./parser').ParsedCard; provider: string; missing: import('./parser').MissingField[] }>
  },
  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Kuvan lataus epäonnistui')
    return res.json() as Promise<{ url: string }>
  },
}

export function getRole(): Role {
  if (typeof document === 'undefined') return 'admin'
  const m = document.cookie.match(/tk_role=(admin|editor|viewer)/)
  return (m?.[1] as Role) ?? 'admin'
}

export function setRole(role: Role): void {
  document.cookie = `tk_role=${role}; path=/; max-age=31536000`
}

export const can = {
  createBrand: (r: Role) => r === 'admin',
  editBrand: (r: Role) => r === 'admin',
  deleteCard: (r: Role) => r === 'admin',
  editCard: (r: Role) => r === 'admin' || r === 'editor',
  export: (r: Role) => r === 'admin' || r === 'editor',
  approve: (r: Role) => r === 'admin' || r === 'editor',
}
