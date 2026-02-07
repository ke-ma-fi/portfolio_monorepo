import { Endpoint } from 'payload'
import createConnectedAccount from './createConnectedAccount'
import { getOnboardingLink, getLoginLink } from './getConnectedAccountLinks'

export const stripeEndpoints: Endpoint[] = [
  createConnectedAccount,
  getOnboardingLink,
  getLoginLink,
]
