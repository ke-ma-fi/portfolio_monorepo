import { PayloadRequest } from 'payload'
import { getServicePayload } from '@/services/baseService'
import { getCardsByEmail } from '@/services/cards'
import { sendGiftCardEmail } from '@/services/notifications'

interface RecoverCardsOptions {
  email: string
  req?: PayloadRequest
}

export async function recoverCards({ email, req }: RecoverCardsOptions) {
  const payload = await getServicePayload({ req })

  // 1. Get Cards
  const cards = await getCardsByEmail(payload, email)

  if (cards.length > 0) {
    // 2. Send Email
    await sendGiftCardEmail({
      payload,
      email,
      type: 'recovery',
      cards,
      context: {
        // We let notification service handle formatting
      },
    })
  }

  // Always return success to prevent email enumeration
  return true
}
