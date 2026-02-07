import type { CollectionBeforeChangeHook } from 'payload'
import { randomUUID } from 'crypto'

export const generateUUID: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create') {
    if (!data.uuid) {
      data.uuid = randomUUID()
    }
    if (!data.recipientUuid) {
      data.recipientUuid = randomUUID()
    }
  }
  return data
}
