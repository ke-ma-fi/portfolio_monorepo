import { Payload, PayloadRequest } from 'payload'
import Stripe from 'stripe'
import { PaymentTransactionsSlug, GiftCardsSlug } from '@/slugs'
import { GiftCard } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { createPaymentTransaction } from '@/services/billing'
import { createCard } from '@/services/cards'
import { sendGiftCardEmail } from '@/services/notifications'
import crypto from 'crypto'
import { getServicePayload } from '@/services/baseService'
import { GiftCardOffersSlug, SettingsSlug } from '@/slugs'
import { GiftCardOffer, Company, Setting } from '@/payload-types'
import stripe from '@/endpoints/stripe/stripe'
import { PaymentTransaction } from '@/payload-types'
interface OrderFulfillmentOptions {
  payload: Payload
  req?: PayloadRequest
  session: Stripe.Checkout.Session
}

export async function fulfillOrder({ payload, req, session }: OrderFulfillmentOptions) {
  const {
    offerId,
    customerEmail,
    type,
    isGift,
    recipientName,
    recipientEmail,
    message,
    existingCardUuid,
  } = session.metadata || {}

  if (type !== 'gift_card_purchase' || !offerId || !customerEmail) {
    return
  }

  // Idempotency Check
  const { docs: existingTransactions } = await payload.find({
    req,
    collection: PaymentTransactionsSlug,
    where: {
      stripeSessionId: { equals: session.id },
    },
    limit: 1,
  })

  if (existingTransactions.length > 0) {
    console.log(`[Order Fulfillment] Transaction for session ${session.id} already exists. Skipping processing.`)
    return
  }

  console.log(`[Order Fulfillment] Processing order for offer ${offerId} by ${customerEmail}`)

  try {
    // 1. Manage Customer (CRM)
    const { ensureCustomer } = await import('@/services/customers')
    
    // Parse name
    const stripeName = session.customer_details?.name || ''
    const [firstName, ...lastNameParts] = stripeName.split(' ')
    const lastName = lastNameParts.join(' ')

    const customer = await ensureCustomer({
        payload,
        req,
        email: customerEmail,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: session.customer_details?.phone || undefined,
    })
    
    const customerId = customer.id
    const customerFirstName = customer.firstName || undefined

    // 2. Fetch Offer & Company Details (Critical for Optimization)
    const { docs: offers } = await payload.find({
        req,
        collection: GiftCardOffersSlug,
        where: { id: { equals: parseInt(offerId) }},
        depth: 2, // Ensure we get Company -> OwnedBy
        limit: 1
    })
    if (!offers[0]) throw new Error('Offer not found during fulfillment')

    const offer = offers[0] as GiftCardOffer
    const company = offer.company as Company
    const companyId = company.id
    
    // Explicitly resolve the owner ID, handling the fact that typeof null === 'object'
    const ownedBy = company.ownedBy 
      ? (typeof company.ownedBy === 'object' ? company.ownedBy.id : company.ownedBy)
      : undefined

    // 3. Create or Update Gift Card (FIRST)
    let card: GiftCard | undefined

    // Update existing card 
    if (existingCardUuid) {
        const { docs: existingCards } = await payload.find({
            req,
            collection: GiftCardsSlug,
            where: { uuid: { equals: existingCardUuid } },
            limit: 1
        })
        
        if (existingCards.length > 0) {
             card = (await payload.update({
               req,
               collection: GiftCardsSlug,
               id: existingCards[0]!.id,
               data: {
                 customerEmail,
                 buyer: customerId,
                 isPaid: true,
                 status: 'active',

                 activationDate: new Date().toISOString(),
                 ...(isGift === 'true' ? {
                   recipientName,
                   recipientEmail,
                   message,
                   giftedAt: new Date().toISOString()
                 } : {})
               }
             })) as unknown as GiftCard
        }
    }

    // Create New Card if not found/updated
    if (!card) {
        card = await createCard({
            payload,
            req,
            data: {
                offerId: parseInt(offerId),
                uuid: crypto.randomUUID(),
                recipientUuid: crypto.randomUUID(),
                customerEmail,
                buyerId: customerId,
                isPaid: true,
                status: 'active',
                
                // Optimization: Pass pre-resolved data
                company: companyId,
                originalValue: offer.value,
                ownedBy: ownedBy as number | undefined,

                // Gifting
                recipientName: isGift === 'true' ? recipientName : undefined,
                recipientEmail: isGift === 'true' ? recipientEmail : undefined,
                message: isGift === 'true' ? message : undefined,
                giftedAt: isGift === 'true' ? new Date().toISOString() : undefined,
                activationDate: new Date().toISOString(),
            }
        })
    }

    console.log(`Processed Gift Card ${card.code} (${card.id})`)

    // 4. Create Payment Transaction Record (SECOND - Linked to Card)
    const amountTotal = session.amount_total || 0
    const appFee = parseInt(session.metadata?.applicationFee || '0') || 0

    // Pre-Check for Race Condition (Optimization)
    const { docs: preCheckTxn } = await payload.find({
        req,
        collection: PaymentTransactionsSlug,
        where: { stripeSessionId: { equals: session.id } },
        limit: 1
    })

    if (preCheckTxn.length > 0) {
        console.log(`[Order Fulfillment] Transaction already exists (Pre-Check). Skipping creation & email.`)
        return
    }

    try {
        const paymentTransaction = await createPaymentTransaction({
            payload,
            req,
            data: {
                amount: amountTotal / 100,
                transactionType: 'online_purchase',
                paymentProvider: 'stripe',
                status: 'succeeded',
                currency: session.currency || 'EUR',
                stripeSessionId: session.id,
                platformFee: appFee / 100,
                netAmount: (amountTotal - appFee) / 100,
                relatedGiftCard: card.id, // Linked immediately
                company: companyId!,
                feeStatus: 'paid_via_stripe',
                customer: customerId,
                ownedBy: ownedBy as number | undefined
            }
        }) 
        console.log(`Recorded Payment Transaction ${paymentTransaction.id} for Card ${card.id}`)
    } catch (error) {
         console.warn('Failed to create payment transaction. Checking for race condition...', error)
         const { docs: existing } = await payload.find({
            req,
            collection: PaymentTransactionsSlug,
            where: { stripeSessionId: { equals: session.id } },
            limit: 1
        })
        if (existing.length > 0) {
            console.log('Transaction already exists. Skipping.')
            return
        }
        throw error
    }


    // 5. Send Emails via Notification Service
    const receiptDetails = {
      totalAmount: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
        amountTotal / 100,
      ),
      date: new Date().toLocaleDateString('de-DE'),
      transactionId: session.id, 
      vatNote: 'Mehrzweckgutschein - Umsatzsteuer wird erst bei Einlösung fällig (0% MwSt. ausgewiesen).',
    }
    
    // a. Send Receipt to Buyer
    // If it's a gift, the receipt is still sent to buyer, showing "Verschenkt" status.
    // If it's self, it shows "Aktiv".
    // The notification service handles the status label based on card.giftedAt
    await sendGiftCardEmail({
        payload,
        email: customerEmail,
        type: 'receipt',
        cards: [card],
        context: {
            buyerName: customerFirstName,
            receiptDetails,
        }
    })

    // b. Send Gift Notification to Recipient (if applicable)
    if (isGift === 'true' && recipientEmail) {
        await sendGiftCardEmail({
            payload,
            email: recipientEmail,
            type: 'gift_notification',
            cards: [card], // The logic will treat this as recipient view
            context: {
                buyerName: customerFirstName
            }
        })
    }

  } catch (error) {
    console.error('Error processing gift card purchase:', error)
    throw error // Retry webhook
  }
}

interface CreateCheckoutSessionOptions {
  offerId: number
  email: string
  gifting?: {
    isGift: boolean
    recipientName?: string
    recipientEmail?: string
    message?: string
  }
  existingCardUuid?: string
  req?: PayloadRequest
}

export async function createCheckoutSession({ offerId, email, gifting, existingCardUuid, req }: CreateCheckoutSessionOptions) {
  const payload = await getServicePayload({ req })
  const baseURL = getServerSideURL()

  if (!offerId || !email) {
    throw new Error('Missing required fields')
  }

  if (gifting?.isGift) {
    if (!gifting.recipientName || !gifting.recipientEmail) {
      throw new Error('Recipient name and email are required for gifts')
    }
  }

  const offer = (await payload.findByID({
    req,
    collection: GiftCardOffersSlug,
    id: offerId,
    depth: 1,
  })) as GiftCardOffer

  if (!offer) {
    throw new Error('Offer not found')
  }

  const company = offer.company as Company

  if (
    !company ||
    typeof company !== 'object' ||
    !company.stripeAccountId ||
    !company.chargesEnabled
  ) {
    throw new Error('Merchant payment setup incomplete')
  }

  // Fetch Global Settings for default commission
  let defaultRate = 5 // Safety fallback
  try {
    const settings = (await payload.findGlobal({
      req,
      slug: SettingsSlug,
    })) as Setting
    if (
      settings.defaultCommissionRate !== undefined &&
      settings.defaultCommissionRate !== null
    ) {
      defaultRate = settings.defaultCommissionRate
    }
  } catch (e) {
    console.warn('Could not fetch global settings, using fallback rate', e)
    // Non-blocking, continue with default
  }

  // Calculate Application Fee (Provision)
  const rate = company.commissionRate ?? defaultRate
  const amountInCents = Math.round(offer.price * 100)
  const applicationFee = Math.round(amountInCents * (rate / 100))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // PayPal requires special Connect approval
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${offer.title} (${company.displayName || company.legalName})`,
            description: offer.description || undefined,
            images:
              offer.cardImage && typeof offer.cardImage === 'object' && offer.cardImage.url
                ? [`${offer.cardImage.url}`]
                : undefined,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: company.stripeAccountId,
      },
    },
    success_url: `${baseURL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseURL}/shops/${company.slug}/buy/${offerId}`,
    metadata: {
      offerId: offerId.toString(),
      customerEmail: email,
      type: 'gift_card_purchase',
      applicationFee: applicationFee.toString(),
      isGift: gifting?.isGift ? 'true' : 'false',
      recipientName: gifting?.recipientName || '',
      recipientEmail: gifting?.recipientEmail || '',
      message: gifting?.message || '',
      existingCardUuid: existingCardUuid || '',
    },
  })

  if (!session.url) {
    throw new Error('Stripe checkout session created but URL is missing')
  }

  return { url: session.url }
}