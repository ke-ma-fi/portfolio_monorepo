import type { CollectionBeforeChangeHook } from 'payload'
import { calculateCardExpiry } from '@/services/cards'

export const calculateExpiryDate: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (
    (operation === 'create' || operation === 'update') &&
    data.isPaid &&
    data.status === 'active' &&
    !data.expiryDate &&
    data.offer
  ) {
      const activationDate = data.activationDate || new Date().toISOString()
      
      // Ensure activation date is set on data if missing
      if (!data.activationDate) {
          data.activationDate = activationDate
      }

      const expiry = await calculateCardExpiry({
          req,
          offerId: data.offer,
          activationDate
      })

      if (expiry) {
          data.expiryDate = expiry
      }
  }
  return data
}
