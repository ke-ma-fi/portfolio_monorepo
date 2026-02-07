import stripe from '@/endpoints/stripe/stripe'
import { PayloadRequest } from 'payload'
import { CompaniesSlug, UsersSlug } from '@/slugs'

interface CreateConnectedAccountOptions {
  req: PayloadRequest
}

export async function createConnectedAccount({ req }: CreateConnectedAccountOptions) {
    if (!req.user || req.user.role !== 'company') {
      throw new Error('Unauthorized')
    }
    if (req.user.connectedAccountId) {
      return { accountId: req.user.connectedAccountId }
    }

    try {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: {
            type: 'express',
          },
          fees: {
            payer: 'application',
          },
          losses: {
            payments: 'application',
          },
        },
      })
      if (!account.id) {
        throw new Error('Failed to create connected account')
      }
      
      // Update User
      await req.payload.update({
        req,
        collection: UsersSlug,
        id: req.user.id,
        overrideAccess: true,
        data: {
          connectedAccountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: (account.charges_enabled && account.payouts_enabled) || false,
        },
      })

      // Create Company
      await req.payload.create({
        req,
        collection: CompaniesSlug,
        data: {
          displayName: `${req.user.firstName}'s Company`,
          stripeAccountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: account.charges_enabled && account.payouts_enabled,
          ownedBy: req.user.id,
        },
      })

      return { accountId: account.id }
    } catch (error) {
      console.error('An error occurred when calling the Stripe API to create an account:', error)
      throw error
    }
}

interface GetOnboardingLinkOptions {
    req: PayloadRequest
    origin: string
}

export async function getStripeOnboardingLink({ req, origin }: GetOnboardingLinkOptions) {
     if (!req.user || req.user.role !== 'company') {
         throw new Error('Unauthorized')
     }
     const accountId = req.user.connectedAccountId
     if (!accountId) {
         throw new Error('Connected account does not exist')
     }

     const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/admin/account`,
        return_url: `${origin}/admin/account`,
        type: 'account_onboarding',
        collect: 'currently_due',
      })

      return { url: accountLink.url }
}

interface GetLoginLinkOptions {
    req: PayloadRequest
}

export async function getStripeLoginLink({ req }: GetLoginLinkOptions) {
     if (!req.user || req.user.role !== 'company') {
         throw new Error('Unauthorized')
     }
     const accountId = req.user.connectedAccountId
     if (!accountId) {
         throw new Error('Connected account does not exist')
     }
     
     const loginLink = await stripe.accounts.createLoginLink(accountId)
     return { url: loginLink.url }
}
