import type { CollectionAfterChangeHook } from 'payload'
import { syncCardToLedger } from '@/services/billing'

export const recordLedgerEntry: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  await syncCardToLedger({
      req,
      card: doc,
      previousCard: previousDoc,
      operation,
  })

  return doc
}
