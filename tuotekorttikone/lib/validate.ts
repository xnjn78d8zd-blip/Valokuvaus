// Kriittisten tietojen validointi.
// Korttia ei voi hyväksyä ennen kuin nämä ovat kunnossa.
import type { AnyCard } from './types'

export interface ValidationError {
  field: string
  message: string
}

export function validateForApproval(card: Partial<AnyCard>): ValidationError[] {
  const errors: ValidationError[] = []
  if (!card.name?.trim()) errors.push({ field: 'name', message: 'Nimi puuttuu' })
  if (!card.brandId) errors.push({ field: 'brandId', message: 'Brändi puuttuu' })
  if (!card.kind) errors.push({ field: 'kind', message: 'Korttityyppi puuttuu' })

  const hasInstruction =
    ('instructions' in card && card.instructions?.trim()) ||
    ('description' in card && (card as { description?: string }).description?.trim()) ||
    ('assembly' in card && (card as { assembly?: string }).assembly?.trim())
  if (!hasInstruction) {
    errors.push({ field: 'instructions', message: 'Vähintään yksi ohje tai kuvaus vaaditaan' })
  }

  const allergensOk =
    (card.allergens && card.allergens.length > 0) ||
    card.allergensUnknown === true ||
    card.notApplicable?.includes('allergens') ||
    (card as { allergenOther?: string }).allergenOther?.trim()
  if (!allergensOk) {
    errors.push({
      field: 'allergens',
      message: 'Allergeenit on täytettävä tai merkittävä "ei tiedossa"',
    })
  }

  if (!card.version?.trim()) errors.push({ field: 'version', message: 'Versionumero puuttuu' })
  return errors
}
