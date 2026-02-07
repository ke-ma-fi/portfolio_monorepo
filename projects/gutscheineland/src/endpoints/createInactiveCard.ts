import { PayloadHandler } from 'payload'
import { createInactiveCard } from '@/services/cards'

export const createInactiveCardEndpoint: PayloadHandler = async (req) => {
  if (!req.json) {
    return Response.json({ error: 'JSON body required' }, { status: 400 })
  }

  const { offerId } = await req.json()
  const parsedOfferId = parseInt(offerId)

  if (!offerId || isNaN(parsedOfferId)) {
    return Response.json({ error: 'Valid offerId is required' }, { status: 400 })
  }

  try {
    // Create inactive card via Service
    const card = await createInactiveCard({
      req,
      offerId: parsedOfferId,
    })

    return Response.json({ uuid: card.uuid, code: card.code })
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error creating inactive card:', error)
    if (error.message === 'Offer not found') {
        return Response.json({ error: 'Offer not found' }, { status: 404 })
    }
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
