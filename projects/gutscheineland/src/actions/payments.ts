'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createCheckoutSession, fulfillOrder } from '@/services/orders'
import stripe from '@/endpoints/stripe/stripe'

/**
 * Initiates a Stripe Checkout Session for a Gift Card Offer.
 * 
 * @param offerId - The ID of the Gift Card Offer selected
 * @param email - The buyer's email address
 * @param gifting - Optional gifting details (recipient, message)
 * @param existingCardUuid - Optional UUID to top-up/pay for an existing card
 * @returns The Stripe Checkout URL to redirect the user to
 */
export async function createCheckoutSessionAction(
  offerId: number,
  email: string,
  gifting?: {
    isGift: boolean
    recipientName?: string
    recipientEmail?: string
    message?: string
  },
  existingCardUuid?: string,
) {
  try {
    const payload = await getPayload({ config: configPromise })

    if (!offerId || !email) {
      return { error: 'Missing required fields', status: 400 }
    }

    const { url } = await createCheckoutSession({
      offerId,
      email,
      gifting,
      existingCardUuid,
      req: { payload } as any,
    })

    return { url }
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Stripe Checkout Error:', error)
    return { error: error.message || 'Payment initiation failed', status: 500 }
  }
}

/**
 * Verifies a successful Stripe Checkout Session and fulfills the order.
 * 
 * This action is typically called from the success page after a redirect from Stripe.
 * It ensures the payment is 'paid', validates metadata, and triggers card issuance.
 * 
 * @param sessionId - The Stripe Checkout Session ID
 * @returns Status object indicating success or failure
 */
export async function verifyOrderAction(sessionId: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    if (!sessionId) return { error: 'Session ID required', status: 400 }

    // 1. Retrieve Stripe Session
    // Logic kept here or move to service? 
    // The service `fulfillOrder` expects a Session Object.
    // The action is the "Transport/Controller" that receives ID from URL and orchestrates.
    // So fetching session here is fine, OR we create `verifyOrder` service.
    // `fulfillOrder` is pure logic given data.
    // Let's keep fetching here for now as it's part of input resolution.
    
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session) return { error: 'Invalid Session', status: 404 }

    if (session.payment_status !== 'paid') {
      return { status: 'pending', message: 'Payment not confirmed yet.' }
    }

    // 2. Validate Metadata
    const { offerId, customerEmail, type } = session.metadata || {}

    if (type !== 'gift_card_purchase' || !offerId || !customerEmail) {
      return { error: 'Invalid Order Metadata', status: 400 }
    }

    // 3. Fulfill Order via Service
    await fulfillOrder({ 
        payload, // Old signature allowed just payload, but we should align eventually
        req: { payload } as any,
        session 
    })

    return { status: 'success', message: 'Order fulfilled successfully.' }

  } catch (error: any) {
    console.error('Error verifying order:', error)
    return { error: error.message || 'Internal Verification Error', status: 500 }
  }
}
