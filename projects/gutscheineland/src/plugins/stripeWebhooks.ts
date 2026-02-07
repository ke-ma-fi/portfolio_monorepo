import { StripeWebhookHandlers } from '@payloadcms/plugin-stripe/types'
import { fulfillOrder } from '@/services/orders'
import { handleStripeAccountUpdate } from '@/services/merchant'

export const stripeWebhooks: StripeWebhookHandlers = {
  'checkout.session.completed': async ({ event, payload, req }) => {
    console.log(`[Stripe Webhook] checkout.session.completed: ${event.id}`)
    const session = event.data.object
    await fulfillOrder({ payload, req, session })
  },
  'account.updated': async ({ event, payload, req }) => {
    console.log(`[Stripe Webhook] account.updated: ${event.id}`)
    const account = event.data.object
    await handleStripeAccountUpdate({ req, account })
  },
  'account.application.deauthorized': async ({ event: _event, payload: _payload }) => {
    console.log(`[Stripe Webhook] account.application.deauthorized: ${_event.id}`)
    return
  },
}
