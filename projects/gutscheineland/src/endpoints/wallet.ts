import { Endpoint } from 'payload'
import { generateAppleWalletPass } from '@/services/wallet'

export const walletEndpoints: Endpoint[] = [
  {
    path: '/wallet/apple/:uuid',
    method: 'get',
    handler: async (req) => {
      const { uuid } = req.routeParams as { uuid: string }
      if (!uuid) return Response.json({ error: 'Missing UUID' }, { status: 400 })

      try {
        const passBuffer = await generateAppleWalletPass({ req, uuid })
        
        return new Response(passBuffer as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename=pass-${uuid}.pkpass`,
          },
        })

      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Apple Wallet Error:', error)
        if (error.message === 'Card not found') {
            return Response.json({ error: 'Card not found' }, { status: 404 })
        }
        return Response.json({ error: error.message || 'Error generating pass' }, { status: 500 })
      }
    },
  },
]
