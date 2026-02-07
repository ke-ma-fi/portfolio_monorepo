import type { Endpoint } from 'payload'
import { getStripeOnboardingLink, getStripeLoginLink } from '@/services/stripe'

export const getOnboardingLink: Endpoint = {
  path: '/stripe/create-onboarding-link',
  method: 'post',
  handler: async (req) => {
    try {
      const origin = process.env.SERVER_URL || req.headers.get('origin') || ''
      if (!origin) {
        return Response.json(
          { error: 'origin could not be determined' },
          { status: 400 }
        )
      }
      const { url } = await getStripeOnboardingLink({ req, origin })
      return Response.json({ url })
    } catch (error: any) {
        if (error.message === 'Unauthorized') return Response.json({ error: 'unauthorized' }, { status: 401 })
        if (error.message === 'Connected account does not exist') return Response.json({ error: 'connected account does not exist' }, { status: 400 })
        
        console.error('Error creating onboarding link:', error)
        return Response.json({ error: 'an error occurred' }, { status: 500 })
    }
  },
}

export const getLoginLink: Endpoint = {
  path: '/stripe/get-login-link',
  method: 'post',
  handler: async (req) => {
    try {
        const { url } = await getStripeLoginLink({ req })
        return Response.json({ url })
    } catch (error: any) {
        if (error.message === 'Unauthorized') return Response.json({ error: 'unauthorized' }, { status: 401 })
        if (error.message === 'Connected account does not exist') return Response.json({ error: 'connected account does not exist' }, { status: 400 })
        
        console.error('Error creating login link:', error)
        return Response.json({ error: 'an error occurred' }, { status: 500 })
    }
  },
}
