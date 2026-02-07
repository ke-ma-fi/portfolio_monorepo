import type { CollectionBeforeChangeHook } from 'payload'
import { populateCardDetails } from '@/services/cards'

export const populateFromOffer: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Only run on create or update
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
      const updates = await populateCardDetails({ req, data })
      Object.assign(data, updates)
  } catch (error) {
    console.error('Error in populateFromOffer hook:', error)
  }

  return data
}
