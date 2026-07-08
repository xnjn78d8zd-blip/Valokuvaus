// Palvelinpuolen tietovarasto.
// DEMO-tila: .data/db.json — toimii ilman mitään ympäristömuuttujia.
// Supabase-tila: kytkeytyy päälle kun NEXT_PUBLIC_SUPABASE_URL on asetettu
// (katso supabase/schema.sql ja README).
import fs from 'fs'
import path from 'path'
import type { Database } from './types'
import { seedDatabase } from './seed'

const DATA_DIR = path.join(process.cwd(), '.data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

export const usingSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

function ensure(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedDatabase(), null, 2))
  }
}

export function readDb(): Database {
  ensure()
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Database
}

export function writeDb(db: Database): void {
  ensure()
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

export function audit(db: Database, by: string, action: string, target: string, detail?: string) {
  db.audit.unshift({
    id: 'audit-' + Math.random().toString(36).slice(2, 10),
    at: new Date().toISOString(),
    by,
    action,
    target,
    detail,
  })
  db.audit = db.audit.slice(0, 500)
}

export function newId(prefix: string): string {
  return prefix + '-' + Math.random().toString(36).slice(2, 10)
}
