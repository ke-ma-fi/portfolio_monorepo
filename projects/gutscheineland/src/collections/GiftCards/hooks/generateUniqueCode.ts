import type { CollectionBeforeChangeHook } from 'payload'
import { generateUniqueCardCode } from '@/services/cards'

export const generateUniqueCode: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' && !data.code) {
      data.code = await generateUniqueCardCode({ req, code: data.code })
  }
  return data
}
