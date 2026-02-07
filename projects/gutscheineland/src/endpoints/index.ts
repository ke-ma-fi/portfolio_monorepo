import { Endpoint } from 'payload'
import { giftCardsEndpoints } from './giftCards'
import { stripeEndpoints } from './stripe'
import { createInactiveCardEndpoint } from './createInactiveCard'
import { walletEndpoints } from './wallet'
import { runBillingEndpoint } from './billing'

export const payloadEndpoints: Endpoint[] = [
  ...giftCardsEndpoints,
  ...stripeEndpoints,
  ...walletEndpoints,
  {
    path: '/create-inactive-card',
    method: 'post',
    handler: createInactiveCardEndpoint,
  },
  {
    path: '/billing/run',
    method: 'post',
    handler: runBillingEndpoint,
  },
]
