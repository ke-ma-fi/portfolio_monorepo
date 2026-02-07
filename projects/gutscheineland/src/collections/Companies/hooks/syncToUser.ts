import type { CollectionAfterChangeHook } from 'payload'
import { syncUserWithCompany } from '@/services/users'

export const syncToUser: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!doc.stripeAccountId) {
    console.warn(`No stripeAccountId found for company ${doc.id}. Skipping sync to user.`)
    return doc
  }
  try {
      await syncUserWithCompany({
          req,
          stripeAccountId: doc.stripeAccountId,
          data: {
              chargesEnabled: doc.chargesEnabled,
              payoutsEnabled: doc.payoutsEnabled,
              detailsSubmitted: doc.detailsSubmitted,
              onboardingComplete: doc.onboardingComplete,
          }
      })
  } catch (error) {
    console.error(`Failed to sync company to user:`, error)
  }
  return doc
}
