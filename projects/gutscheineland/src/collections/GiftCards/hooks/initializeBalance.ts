import type { CollectionBeforeChangeHook } from 'payload'

export const initializeRemainingBalance: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (
    (operation === 'create' || operation === 'update') &&
    data.originalValue != null &&
    data.remainingBalance == null
  ) {
    data.remainingBalance = data.originalValue
  }
  return data
}
