import { PayloadRequest } from 'payload'
import { getServicePayload } from '@/services/baseService'
import { generateCode } from '@/utilities/generateCode'
import { CompaniesSlug, GiftCardsSlug } from '@/slugs'
import { Company, Customer, GiftCard } from '@/payload-types'
import { giftNotificationEmail } from '@/emails/templates/giftNotification'
import { getServerSideURL } from '@/utilities/getURL'
import crypto from 'crypto'

interface ResendGiftNotificationOptions {
  uuid: string
  req?: PayloadRequest
}

export async function resendGiftNotification({ uuid, req }: ResendGiftNotificationOptions) {
  const payload = await getServicePayload({ req })
  const baseURL = getServerSideURL()

  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: {
      uuid: { equals: uuid },
    },
    depth: 1,
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }
  const card = cards[0] as GiftCard

  if (!card.recipientEmail) {
    throw new Error('Card has no recipient email')
  }

  let company = card.company as Company
    
  // Ensure company is populated
  if (typeof card.company !== 'object' && card.company) {
      const companyRes = await payload.findByID({
          req,
          collection: CompaniesSlug,
          id: card.company as number
      })
      company = companyRes as Company
  }
  
  const companyName = company?.displayName || company?.legalName || 'Gutscheineland'
  
  // Determine Buyer Name
  let buyerName = undefined
  if (card.buyer && typeof card.buyer === 'object' && 'firstName' in card.buyer) {
    buyerName = (card.buyer as Customer).firstName || undefined
  }

  const formattedValue = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(card.originalValue || 0)

  const formattedOriginalValue = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(card.originalValue || 0)

  const expiryDate = card.expiryDate
    ? new Date(card.expiryDate).toLocaleDateString('de-DE')
    : 'Unbegrenzt'

  const emailHtml = giftNotificationEmail({
    recipientName: card.recipientName || 'Empfänger',
    buyerName,
    companyName,
    message: card.message || undefined,
    value: formattedValue,
    originalValue: formattedOriginalValue,
    expiryDate,
    viewLink: `${baseURL}/view/${card.recipientUuid}`,
  })

  await payload.sendEmail({
    to: card.recipientEmail,
    subject: `Ein Geschenk von ${buyerName || 'jemandem'} für dich! 🎁`,
    html: emailHtml,
  })

  return true
}

interface SendGiftCardOptions {
  uuid: string
  email: string
  name: string
  message: string
  req?: PayloadRequest
}

export async function sendGiftCard({ uuid, email, name, message, req }: SendGiftCardOptions) {
  const payload = await getServicePayload({ req })

  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: {
      uuid: { equals: uuid },
    },
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }
  const card = cards[0] as GiftCard

  if (card.giftedAt || card.printedAt) {
    throw new Error('Diese Karte wurde bereits verschenkt oder gedruckt und kann nicht mehr geändert werden.')
  }

  const newCode = generateCode()
  const newRecipientUuid = crypto.randomUUID()

  await payload.update({
    req,
    collection: GiftCardsSlug,
    id: card.id,
    data: {
      recipientEmail: email,
      recipientName: name,
      message: message,
      giftedAt: new Date().toISOString(),
      code: newCode,
      recipientUuid: newRecipientUuid,
    },
  })

  // We reuse the service logic for notification
  // Since we just updated the card, resendGiftNotification (which fetches by UUID) 
  // will see the new data.
  await resendGiftNotification({ uuid, req })

  return true
}

interface RegisterRecipientOptions {
  uuid: string
  email: string
  req?: PayloadRequest
}

export async function registerRecipient({ uuid, email, req }: RegisterRecipientOptions) {
  const payload = await getServicePayload({ req })

  const { docs: cards } = await payload.find({
     req,
     collection: GiftCardsSlug,
     where: {
         or: [
             { uuid: { equals: uuid } },
             { recipientUuid: { equals: uuid } }
         ]
     },
     limit: 1
  })
  
  if (cards.length === 0) {
    throw new Error('Card not found')
  }
  const card = cards[0] as GiftCard

  if (card.recipientEmail) {
     throw new Error('Gutschein wurde bereits einem Empfänger zugeordnet.')
  }

  await payload.update({
      req,
      collection: GiftCardsSlug,
      id: card.id,
      data: {
          recipientEmail: email,
      }
  })
  
  return true
}
