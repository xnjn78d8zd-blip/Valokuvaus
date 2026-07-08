// Sääntöpohjainen Smart Import -jäsennin.
// Toimii ilman API-avainta; LLM-provider (lib/llm.ts) tuottaa saman muodon.
import { ALLERGENS, type Ingredient } from './types'

export interface ParsedCard {
  kind: 'product' | 'misa'
  name?: string
  description?: string
  category?: string
  ingredients: Ingredient[]
  instructions?: string
  assembly?: string
  serving?: string
  storage?: string
  shelfLife?: string
  temperatures?: string
  prepTime?: string
  yieldAmount?: string
  portionSize?: string
  portionWeight?: string
  price?: string
  allergens: string[]
  allergenOther?: string
  container?: string
  storageTemp?: string
  dosing?: string
  usedIn?: string
  notes?: string
}

const UNIT_RE = /^(\d+(?:[.,]\d+)?)\s*(kg|g|l|dl|ml|kpl|%|rkl|tl|annosta|ann)\b/i
const QTY_IN_LINE = /(\d+(?:[.,]\d+)?)\s*(kg|g|l|dl|ml|kpl|%|rkl|tl)\b/i

const ALLERGEN_WORDS: Record<string, string[]> = {
  gluten: ['gluteeni', 'vehnä', 'ruis', 'ohra', 'gluten'],
  milk: ['maito', 'laktoosi', 'kerma', 'voi ', 'juusto', 'milk'],
  egg: ['kananmuna', 'muna', 'majoneesi', 'egg'],
  fish: ['kala', 'lohi', 'seiti', 'tonnikala', 'fish'],
  crustacean: ['äyriäi', 'katkarapu', 'rapu'],
  soy: ['soija', 'soy'],
  nuts: ['pähkinä', 'manteli', 'cashew', 'hassel'],
  peanut: ['maapähkinä', 'peanut'],
  celery: ['selleri', 'celery'],
  mustard: ['sinappi', 'dijon', 'mustard'],
  sesame: ['seesami', 'tahini', 'sesam'],
  sulphite: ['sulfiitti', 'rikkidioksidi', 'e220', 'e228'],
  lupin: ['lupiini', 'lupin'],
  mollusc: ['nilviäi', 'simpukka', 'mustekala'],
}

function detectAllergens(text: string): string[] {
  const lower = ' ' + text.toLowerCase() + ' '
  const found = new Set<string>()
  for (const [key, words] of Object.entries(ALLERGEN_WORDS)) {
    if (words.some((w) => lower.includes(w))) found.add(key)
  }
  return [...found]
}

function grab(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return m[1]?.trim() ?? m[0].trim()
  }
  return undefined
}

export function parseRawText(raw: string): ParsedCard {
  const text = raw.replace(/\r\n/g, '\n').trim()
  const lines = text
    .split(/\n|(?<=\.)\s{2,}/)
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)

  const out: ParsedCard = { kind: 'product', ingredients: [], allergens: [] }

  // Nimi: ensimmäinen rivi ennen kaksoispistettä tai koko eka rivi
  if (lines[0]) {
    const head = lines[0]
    const colon = head.indexOf(':')
    out.name = (colon > 0 && colon < 48 ? head.slice(0, colon) : head.split('.')[0])
      .replace(/^resepti\s*/i, '')
      .trim()
    if (/kastike|majo|hummus|misa|salaatti(?:pohja)?|marinadi|seos|dippi/i.test(out.name)) {
      out.kind = 'misa'
    }
  }

  // Raaka-aineet: rivit tai pilkulla erotellut osat joissa määrä + yksikkö
  const body = text.replace(/\n/g, ' , ')
  const parts = body.split(/[,;]/).map((p) => p.trim()).filter(Boolean)
  for (const p of parts) {
    const qty = p.match(QTY_IN_LINE)
    if (!qty) continue
    // ohita lämpötila-/aika-/painorivit
    if (/°|astetta|min\b|tunti|säily|paisto|uuni|annos/i.test(p) && !UNIT_RE.test(p)) continue
    const name = p
      .replace(QTY_IN_LINE, '')
      .replace(/^[^:]{1,48}:\s*/, '') // pudota "Kastike:" -tyylinen etuliite
      .split(/\.(?:\s|$)/)[0]         // katkaise lauseen rajalle
      .replace(/^[\s:–-]+|[\s:–-]+$/g, '')
      .trim()
    if (name.length > 1 && out.ingredients.length < 30) {
      out.ingredients.push({ name: name[0].toUpperCase() + name.slice(1), amount: qty[1], unit: qty[2].toLowerCase() })
    }
  }

  // Ilman määriä listatut ainekset (esim. "briossi, kanafilee 120 g, hot honey")
  // — vain otsikkorivin ensimmäisestä virkkeestä, jotta allergeeni- ja
  // paisto-lauseet eivät vuoda raaka-aineiksi.
  if (lines[0]?.includes(':')) {
    const afterColon = lines[0].slice(lines[0].indexOf(':') + 1).split(/\.(?:\s|$)/)[0]
    for (const raw of afterColon.split(',').map((s) => s.trim()).filter(Boolean)) {
      const p = raw.replace(/\.$/, '')
      if (QTY_IN_LINE.test(p)) continue
      if (/allergeen|paisto|säily|°|astetta/i.test(p)) continue
      if (p.length > 2 && p.length < 40 && !out.ingredients.some((i) => i.name.toLowerCase() === p.toLowerCase())) {
        out.ingredients.push({ name: p[0].toUpperCase() + p.slice(1), amount: '', unit: '' })
      }
    }
  }

  // Lämpötilat
  out.temperatures = grab(text, [
    /((?:paisto|uuni|kypsennys)[^.\n]*?\d{2,3}\s*(?:°C?|astetta)[^.\n]*)/i,
    /(\d{2,3}\s*(?:°C?|astetta)[^.\n]{0,40})/i,
  ])

  // Ajat
  out.prepTime = grab(text, [/(\d+\s*(?:min|minuuttia|h|tuntia)(?:\s*\d+\s*s)?)/i])

  // Säilyvyys
  out.shelfLife = grab(text, [
    /säilyy\s+([^.\n]+)/i,
    /säilyvyys[:\s]+([^.\n]+)/i,
    /(\d+\s*(?:vrk|päivää|pv|viikkoa))\s*(?:kylmässä|jääkaapissa)?/i,
  ])
  if (/kylmässä|jääkaapissa|\+2|\+4/i.test(text)) out.storageTemp = '+2…+4 °C'

  // Annos
  out.portionWeight = grab(text, [/annospaino[:\s]+([^\n.]+)/i, /(\d+\s*g)\s*\/\s*annos/i])
  out.portionSize = grab(text, [/annoskoko[:\s]+([^\n.]+)/i])
  out.price = grab(text, [/(\d+[.,]\d{2})\s*€/])
  out.yieldAmount = grab(text, [/valmistusmäärä[:\s]+([^\n.]+)/i, /saanto[:\s]+([^\n.]+)/i])
  out.dosing = grab(text, [/annostelu[:\s]+([^\n.]+)/i])
  out.usedIn = grab(text, [/käyt(?:etään|tö)[:\s]+([^\n.]+)/i])

  // Allergeenit: eksplisiittinen lista ensin, sitten sanahaku
  const explicit = text.match(/allergeenit?[:\s]+([^\n.]+)/i)
  out.allergens = detectAllergens(explicit ? explicit[1] : text)

  // Ohjeet: imperatiivilauseet, jotka eivät ole raaka-aineita
  const instr = lines.filter(
    (l) =>
      /paista|sekoita|kypsennä|hienonna|kääri|kokoa|lämmitä|vatkaa|keitä|aja |mausta|valuta|leivitä|paahda/i.test(l) &&
      !UNIT_RE.test(l),
  )
  if (instr.length) out.instructions = instr.join(' ')

  return out
}

// ── Puuttuvien tietojen tarkistus ─────────────────────────────────────────
export interface MissingField {
  key: string
  label: string
  critical: boolean
}

export function missingFields(card: ParsedCard | Record<string, unknown>): MissingField[] {
  const c = card as Record<string, unknown>
  const isMisa = c.kind === 'misa'
  const has = (k: string) => {
    const v = c[k]
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== null && String(v).trim() !== ''
  }
  const na = (c.notApplicable as string[] | undefined) ?? []
  const list: MissingField[] = []
  const push = (key: string, label: string, critical: boolean) => {
    if (!has(key) && !na.includes(key)) list.push({ key, label, critical })
  }

  push('name', 'Nimi', true)
  if (!has('instructions') && !has('description') && !na.includes('instructions')) {
    list.push({ key: 'instructions', label: 'Vähintään yksi ohje tai kuvaus', critical: true })
  }
  if (!has('allergens') && !c.allergensUnknown && !na.includes('allergens')) {
    list.push({ key: 'allergens', label: 'Allergeenit (tai merkintä "ei tiedossa")', critical: true })
  }
  if (isMisa) {
    push('yieldAmount', 'Valmistusmäärä', false)
    push('shelfLife', 'Säilyvyys', false)
    push('storageTemp', 'Säilytyslämpötila', false)
    push('container', 'Säilytysastia', false)
    push('dosing', 'Annosteluohje', false)
  } else {
    push('portionSize', 'Annoskoko', false)
    push('shelfLife', 'Säilyvyys', false)
    push('imageUrl', 'Kuva', false)
    push('approver', 'Hyväksyjä', false)
    push('price', 'Myyntihinta', false)
  }
  return list
}
