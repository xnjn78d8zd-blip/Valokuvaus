// Brändin visuaalinen pohja → CSS-muuttujat ja tyyliluokat.
// Kaikki saman brändin kortit renderöityvät näillä automaattisesti.
import type { Brand } from './types'
import type { CSSProperties } from 'react'

export const FONT_STACKS: Record<Brand['fontStyle'], { heading: string; body: string }> = {
  sans: {
    heading: "'Inter','Helvetica Neue',Arial,sans-serif",
    body: "'Inter','Helvetica Neue',Arial,sans-serif",
  },
  serif: {
    heading: "Georgia,'Times New Roman',serif",
    body: "Georgia,'Times New Roman',serif",
  },
  display: {
    heading: "'Playfair Display',Georgia,serif",
    body: "'Inter','Helvetica Neue',Arial,sans-serif",
  },
  condensed: {
    heading: "'Arial Narrow','Roboto Condensed',Arial,sans-serif",
    body: "'Inter',Arial,sans-serif",
  },
}

export function brandVars(brand: Brand): CSSProperties {
  const f = FONT_STACKS[brand.fontStyle]
  return {
    '--b-primary': brand.colors.primary,
    '--b-secondary': brand.colors.secondary,
    '--b-accent': brand.colors.accent,
    '--b-paper': brand.colors.paper,
    '--b-text': brand.colors.text,
    '--b-heading-font': f.heading,
    '--b-body-font': f.body,
    '--b-heading-transform':
      brand.headingStyle === 'uppercase' ? 'uppercase' : 'none',
    '--b-heading-variant':
      brand.headingStyle === 'smallcaps' ? 'small-caps' : 'normal',
    '--b-heading-tracking': brand.headingStyle === 'uppercase' ? '0.08em' : '0.01em',
    '--b-radius':
      brand.imageStyle === 'rounded' ? '14px' : brand.imageStyle === 'circle' ? '999px' : '0px',
  } as CSSProperties
}

export function contrastText(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'
}
