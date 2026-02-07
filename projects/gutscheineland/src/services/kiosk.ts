import { PayloadRequest } from 'payload'
import { getServicePayload } from '@/services/baseService'
import { GiftCardsSlug } from '@/slugs'
import { GiftCard } from '@/payload-types'
import { activateCard } from '@/services/cards'
import { sendGiftCardEmail } from '@/services/notifications'

interface ActivateCardInStoreOptions {
  code: string
  companyId: number
  customerEmail?: string
  req?: PayloadRequest
}

export async function activateCardInStore({ code, companyId, customerEmail, req }: ActivateCardInStoreOptions) {
  const payload = await getServicePayload({ req })

  // 1. Find the card by Code
  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: {
      code: { equals: code },
    },
    depth: 1,
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }

  const card = cards[0] as GiftCard

  // 2. Security: Verify Ownership
  const cardCompanyId = typeof card.company === 'object' ? card.company?.id : card.company
  if (cardCompanyId !== companyId) {
     throw new Error('Card does not belong to your company')
  }

  // 3. Validation
  if (card.status !== 'inactive') {
    throw new Error(`Card is already ${card.status}`)
  }

  // 3.5. Resolve Customer (CRM)
  let buyerId: number | undefined
  if (customerEmail) {
      const { ensureCustomer } = await import('@/services/customers')
      const customer = await ensureCustomer({
          payload,
          req,
          email: customerEmail,
      })
      buyerId = customer.id
  }

  // 4. Activate
  const updatedCard = await activateCard({
    payload,
    req,
    cardId: card.id,
    customerEmail,
    buyerId,
  })

  // 4.1. Record Payment Transaction (Explicit)
  const { createInStoreTransaction } = await import('@/services/billing')
  await createInStoreTransaction({
      req,
      payload,
      card: updatedCard,
      companyId: companyId,
  })

  // 5. Send Notification
  const finalEmail = customerEmail || card.customerEmail
  if (finalEmail) {
    await sendGiftCardEmail({
        payload,
        email: finalEmail,
        type: 'receipt', // It's a receipt for in-store purchase
        cards: [updatedCard],
        context: {}
    })
  }

  return {
    status: updatedCard.status,
    balance: updatedCard.remainingBalance,
    activatedAt: updatedCard.activationDate,
  }
}
