// ── Roolit ────────────────────────────────────────────────────────────────
export type Role = 'admin' | 'editor' | 'viewer'

// ── Brändi ────────────────────────────────────────────────────────────────
export type FontStyle = 'sans' | 'serif' | 'display' | 'condensed'
export type HeadingStyle = 'uppercase' | 'normal' | 'smallcaps'
export type CardStyle = 'bold' | 'minimal' | 'classic'
export type ImageStyle = 'full-bleed' | 'rounded' | 'circle' | 'framed'

export type TemplateKind =
  | 'a4-portrait'
  | 'a4-landscape'
  | 'kitchen'
  | 'product'
  | 'misa'
  | 'allergen'
  | 'compact'
  | 'showcase'

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  paper: string
  text: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  slogan?: string
  footerText?: string
  logoUrl?: string
  colors: BrandColors
  fontStyle: FontStyle
  headingStyle: HeadingStyle
  cardStyle: CardStyle
  imageStyle: ImageStyle
  defaultTemplate: TemplateKind
  templates: TemplateKind[]
  version: string
  createdAt: string
  archived?: boolean
}

// ── Kortit ────────────────────────────────────────────────────────────────
export type CardStatus = 'draft' | 'review' | 'approved' | 'archived'

export interface Ingredient {
  name: string
  amount: string
  unit: string
  note?: string
}

export interface VersionEntry {
  version: string
  savedAt: string
  savedBy: string
  note?: string
  changed?: string[]
  snapshot: unknown
}

export interface ProductCard {
  id: string
  brandId: string
  kind: 'product'
  name: string
  category?: string
  description?: string
  imageUrl?: string
  imageFocus?: { x: number; y: number; zoom: number }
  portionSize?: string
  portionWeight?: string
  price?: string
  cost?: string
  ingredients: Ingredient[]
  instructions?: string
  assembly?: string
  serving?: string
  storage?: string
  shelfLife?: string
  temperatures?: string
  prepTime?: string
  preps?: string
  equipment?: string
  allergens: string[]
  allergenOther?: string
  allergensUnknown?: boolean
  diets: string[]
  warnings?: string
  owner?: string
  approver?: string
  internalNote?: string
  version: string
  status: CardStatus
  updatedAt: string
  updatedBy: string
  versions: VersionEntry[]
  notApplicable?: string[]
}

export interface MisaCard {
  id: string
  brandId: string
  kind: 'misa'
  name: string
  usedIn?: string
  yieldAmount?: string
  imageUrl?: string
  imageFocus?: { x: number; y: number; zoom: number }
  ingredients: Ingredient[]
  instructions?: string
  container?: string
  storageTemp?: string
  shelfLife?: string
  dating?: string
  dosing?: string
  allergens: string[]
  allergenOther?: string
  allergensUnknown?: boolean
  owner?: string
  version: string
  status: CardStatus
  updatedAt: string
  updatedBy: string
  versions: VersionEntry[]
  notApplicable?: string[]
}

export type AnyCard = ProductCard | MisaCard

export interface AuditEntry {
  id: string
  at: string
  by: string
  action: string
  target: string
  detail?: string
}

export interface ExportEntry {
  id: string
  at: string
  by: string
  kind: string
  target: string
}

export interface Database {
  brands: Brand[]
  products: ProductCard[]
  misas: MisaCard[]
  audit: AuditEntry[]
  exports: ExportEntry[]
}

// ── Allergeenit (EU 14) ───────────────────────────────────────────────────
export const ALLERGENS: { key: string; label: string; short: string }[] = [
  { key: 'gluten', label: 'Gluteeni', short: 'G' },
  { key: 'milk', label: 'Maito', short: 'M' },
  { key: 'egg', label: 'Kananmuna', short: 'Mu' },
  { key: 'fish', label: 'Kala', short: 'Ka' },
  { key: 'crustacean', label: 'Äyriäiset', short: 'Äy' },
  { key: 'soy', label: 'Soija', short: 'So' },
  { key: 'nuts', label: 'Pähkinät', short: 'P' },
  { key: 'peanut', label: 'Maapähkinä', short: 'Mp' },
  { key: 'celery', label: 'Selleri', short: 'Se' },
  { key: 'mustard', label: 'Sinappi', short: 'Si' },
  { key: 'sesame', label: 'Seesami', short: 'Ss' },
  { key: 'sulphite', label: 'Rikkidioksidi/sulfiitit', short: 'Su' },
  { key: 'lupin', label: 'Lupiini', short: 'L' },
  { key: 'mollusc', label: 'Nilviäiset', short: 'N' },
]

export const DIETS = ['L', 'VL', 'G', 'M', 'VE', 'VS'] as const

export const STATUS_LABELS: Record<CardStatus, string> = {
  draft: 'Luonnos',
  review: 'Tarkistettavana',
  approved: 'Hyväksytty',
  archived: 'Arkistoitu',
}

export const TEMPLATE_LABELS: Record<TemplateKind, string> = {
  'a4-portrait': 'A4 pysty',
  'a4-landscape': 'A4 vaaka',
  kitchen: 'Keittiökortti',
  product: 'Tuotekortti',
  misa: 'Misa-ohje',
  allergen: 'Allergeenikortti',
  compact: 'Tiivis printti',
  showcase: 'Näyttävä brändiversio',
}
