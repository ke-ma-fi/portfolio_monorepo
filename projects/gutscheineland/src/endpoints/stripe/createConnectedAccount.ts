import type { Endpoint } from 'payload'
import { createConnectedAccount } from '@/services/stripe'

const createConnectedAccountEndpoint: Endpoint = {
  path: '/stripe/create-connected-account',
  method: 'post',
  handler: async (req) => {
    try {
      const { accountId } = await createConnectedAccount({ req })
      return Response.json({ account: accountId })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        return Response.json(
            { error: 'an error occurred while creating the account' },
            { status: 500 },
        )
    }
  },
}

export default createConnectedAccountEndpoint
