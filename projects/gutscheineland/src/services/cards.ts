import { Payload, PayloadRequest } from 'payload'
import { getServicePayload } from '@/services/baseService'
import { generateCode } from '@/utilities/generateCode'
import { CompaniesSlug, GiftCardsSlug } from '@/slugs'
import { GiftCard, Company } from '@/payload-types'
import crypto from 'crypto'
import { GiftCardOffersSlug } from '@/slugs'
import { GiftCardOffer } from '@/payload-types'

interface CreateCardOptions {
  payload: Payload
  req?: PayloadRequest
  data: {
    offerId: number
    uuid?: string // Optional, will generate if missing
    recipientUuid?: string
    customerEmail: string
    buyerId?: number
    isPaid: boolean
    status: 'active' | 'inactive' | 'redeemed' | 'draft'
    // Optimized Population
    company?: number
    originalValue?: number
    ownedBy?: number
    // Gifting
    recipientName?: string
    recipientEmail?: string
    message?: string
    giftedAt?: string
    activationDate?: string
  }
}

interface ActivateCardOptions {
  payload: Payload
  req?: PayloadRequest
  cardId: number
  customerEmail?: string
  buyerId?: number
}

export async function createCard({ payload, req, data }: CreateCardOptions) {
  const card = await payload.create({
    req,
    collection: GiftCardsSlug,
    // @ts-ignore - draft argument is valid in local api
    draft: data.status === 'draft',
    data: {
      offer: data.offerId,
      uuid: data.uuid || crypto.randomUUID(),
      recipientUuid: data.recipientUuid || crypto.randomUUID(),
      customerEmail: data.customerEmail,
      buyer: data.buyerId,
      isPaid: data.isPaid,
      status: data.status === 'draft' ? 'inactive' : data.status,

      // Pre-populated data to avoid hook fetches
      ...(data.company ? { company: data.company } : {}),
      ...(data.originalValue !== undefined ? { originalValue: data.originalValue } : {}),
      ...(data.ownedBy ? { ownedBy: data.ownedBy } : {}),

      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      message: data.message,
      giftedAt: data.giftedAt,
      activationDate: data.activationDate,
    },
  })
  return card as GiftCard
}

export async function activateCard({ payload, req, cardId, customerEmail, buyerId }: ActivateCardOptions) {
  const now = new Date().toISOString()
  const updatedCard = await payload.update({
    req,
    collection: GiftCardsSlug,
    id: cardId,
    overrideAccess: true, // Authorization is handled by the caller (e.g., activateCardInStore verifies card ownership)
    data: {
      status: 'active',
      isPaid: true,

      activationDate: now,
      ...(customerEmail ? { customerEmail } : {}),
      ...(buyerId ? { buyer: buyerId } : {}),
    },
  })
  return updatedCard as GiftCard
}

export async function getCardsByEmail(payload: Payload, email: string) {
  const { docs: cards } = await payload.find({
    collection: GiftCardsSlug,
    where: {
      and: [
        {
          or: [
            { customerEmail: { equals: email } },
            { recipientEmail: { equals: email } },
          ],
        },
        {
          status: { in: ['active', 'inactive', 'redeemed'] },
        },
      ],
    },
    depth: 1,
    limit: 100, // Reasonable limit
  })
  return cards as GiftCard[]
}

interface MarkPrintedOptions {
  uuid: string
  req?: PayloadRequest
}

export async function markCardAsPrinted({ uuid, req }: MarkPrintedOptions) {
  const payload = await getServicePayload({ req })

  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: { uuid: { equals: uuid } },
    limit: 1,
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }

  const card = cards[0]!

  const newCode = generateCode()
  const newRecipientUuid = crypto.randomUUID()

  await payload.update({
    req,
    collection: GiftCardsSlug,
    id: card.id,
    data: {
      printedAt: new Date().toISOString(),
      code: newCode,
      recipientUuid: newRecipientUuid,
    },
  })

  return true
}

// --- Hook Helpers ---

interface UniqueCodeOptions {
  req: PayloadRequest
  code?: string
}

export async function generateUniqueCardCode({ req, code }: UniqueCodeOptions): Promise<string> {
  // If code is provided, check uniqueness immediately
  if (code) {
    const existing = await req.payload.find({
        req,
        collection: GiftCardsSlug,
        where: { code: { equals: code } },
        limit: 1
    })
    if (existing.docs.length > 0) throw new Error('Code already exists')
    return code
  }

  // Otherwise generate one
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const maxRetries = 5
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let newCode = ''
    for (let i = 0; i < 8; i++) {
        const randomIndex = crypto.randomInt(0, allowedChars.length)
        newCode += allowedChars[randomIndex]
    }
    const formattedCode = `${newCode.slice(0, 4)}-${newCode.slice(4)}`

    const existing = await req.payload.find({
        req,
        collection: GiftCardsSlug,
        where: { code: { equals: formattedCode } },
        limit: 1
    })
    
    if (existing.docs.length === 0) {
        return formattedCode
    }
  }
  throw new Error('Failed to generate unique gift card code after maximum retries')
}

interface CalculateExpiryOptions {
  req: PayloadRequest
  offerId: number | GiftCardOffer
  activationDate: string
}

export async function calculateCardExpiry({ req, offerId, activationDate }: CalculateExpiryOptions): Promise<string | null> {
    try {
        const id = typeof offerId === 'object' ? offerId.id : offerId
        const offer = await req.payload.findByID({
            req,
            collection: GiftCardOffersSlug,
            id,
        }) as GiftCardOffer

        if (offer?.expiryDurationDays) {
            const start = new Date(activationDate)
            const expiry = new Date(start)
            expiry.setDate(start.getDate() + offer.expiryDurationDays)
            return expiry.toISOString()
        }
    } catch (e) {
        console.error('Error calculating expiry:', e)
    }
    return null
}

export function resolveCardStatus(data: Partial<GiftCard>, originalDoc?: Partial<GiftCard>) {
    const updates: Partial<GiftCard> = {}

    // Activation Logic
    if (
        data.isPaid &&
        (data.status === 'inactive' || (!data.status && originalDoc?.status === 'inactive') || !data.status)
    ) {
        updates.status = 'active'
        if (!data.activationDate && !originalDoc?.activationDate) {
            updates.activationDate = new Date().toISOString()
        }
    }

    // Redemption Logic
    const currentBalance = data.remainingBalance ?? originalDoc?.remainingBalance
    const currentStatus = updates.status || data.status || originalDoc?.status

    if (
        typeof currentBalance === 'number' &&
        currentBalance === 0 &&
        currentStatus === 'active'
    ) {
        updates.status = 'redeemed'
    }

    return updates
}

interface PopulateOptions {
    req: PayloadRequest
    data: Partial<GiftCard>
}

export async function populateCardDetails({ req, data }: PopulateOptions) {
    const updates: Partial<GiftCard> = {}

    // 1. Populate from Offer
    if (data.offer) {
        const shouldPopulateCompany = !data.company
        const shouldPopulateValue = data.originalValue === undefined || data.originalValue === null
        
        if (shouldPopulateCompany || shouldPopulateValue) {
            const offer = await req.payload.findByID({
                req,
                collection: GiftCardOffersSlug,
                id: typeof data.offer === 'object' ? data.offer.id : data.offer,
            }) as GiftCardOffer

            if (offer) {
                if (shouldPopulateCompany) {
                    updates.company = typeof offer.company === 'object' ? offer.company.id : offer.company
                }
                if (shouldPopulateValue) {
                    updates.originalValue = offer.value
                }
            }
        }
    }

    // 2. Sync ownedBy from Company (using potentially updated company ID)
    const effectiveCompanyId = updates.company || data.company
    if (effectiveCompanyId && !data.ownedBy) {
         const company = await req.payload.findByID({
            req,
            collection: CompaniesSlug,
            id: typeof effectiveCompanyId === 'object' ? effectiveCompanyId.id : effectiveCompanyId as number,
        }) as Company

        if (company && company.ownedBy) {
            updates.ownedBy = typeof company.ownedBy === 'object' ? company.ownedBy.id : company.ownedBy
        }
    }

    return updates
}

interface CreateInactiveCardOptions {
  req: PayloadRequest
  offerId: number
}

export async function createInactiveCard({ req, offerId }: CreateInactiveCardOptions) {
    const offer = await req.payload.findByID({
      req,
      collection: GiftCardOffersSlug,
      id: offerId,
    })

    if (!offer) {
      throw new Error('Offer not found')
    }

    // Create inactive card
    const card = await req.payload.create({
      req,
      collection: GiftCardsSlug,
      overrideAccess: true,
      draft: false,
      data: {
        offer: offerId,
        status: 'inactive',
        uuid: crypto.randomUUID(),
        recipientUuid: crypto.randomUUID(),
        isPaid: false,
        customerEmail: 'system@gutscheineland.de',
        printedAt: new Date().toISOString(),
      },
    })

    return card as GiftCard
}
