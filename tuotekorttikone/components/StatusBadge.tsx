import { STATUS_LABELS, type CardStatus } from '@/lib/types'

const STYLES: Record<CardStatus, string> = {
  draft: 'bg-ink-700/50 text-ink-300',
  review: 'bg-amber-900/40 text-amber-300',
  approved: 'bg-emerald-900/40 text-emerald-300',
  archived: 'bg-ink-800 text-ink-500 line-through',
}

export default function StatusBadge({ status }: { status: CardStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
