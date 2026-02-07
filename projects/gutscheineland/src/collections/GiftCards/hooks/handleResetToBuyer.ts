import type { CollectionBeforeChangeHook } from 'payload'
import { randomUUID } from 'crypto'

const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += allowedChars[Math.floor(Math.random() * allowedChars.length)]
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

export const handleResetToBuyer: CollectionBeforeChangeHook = async ({ data, operation: _operation, req: _req }) => {
  // Only run if the checkbox is checked
  if (data.resetToBuyer) {
    // Reset Fields
    data.recipientName = null
    data.recipientEmail = null
    data.message = null
    data.printedAt = null
    data.giftedAt = null
    
    // Rotate Credentials
    data.code = generateCode()
    data.recipientUuid = randomUUID()

    // Uncheck the box so it doesn't run again automatically
    data.resetToBuyer = false
  }
  return data
}
