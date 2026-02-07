import type { CollectionBeforeChangeHook } from 'payload'
import { resolveCardStatus } from '@/services/cards'

export const handleActivation: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  const updates = resolveCardStatus(data, originalDoc || undefined)
  
  if (Object.keys(updates).length > 0) {
      Object.assign(data, updates)
  }
  
  return data
}
