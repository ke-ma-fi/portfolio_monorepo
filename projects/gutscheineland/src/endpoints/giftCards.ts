import type { Endpoint } from 'payload'
import { scanCard } from '@/services/merchant'
import { CompaniesSlug } from '@/slugs'
import { checkRateLimit } from '@/utilities/rateLimiter'

// Secure endpoint for gift card lookup - only for businesses and admins
export const scanGiftCardEndpoint: Endpoint = {
  path: '/scan-giftcard/:code',
  method: 'get',
  handler: async (req) => {
    const code = req.routeParams?.code
    const user = req.user

    // Authentication required
    if (!user) {
      return Response.json({ error: 'Anmeldung erforderlich' }, { status: 401 })
    }

    // Rate limiting: 20 requests per minute per user to prevent brute force attacks
    const rateLimitKey = `scan-card:${user.id}`
    const rateLimit = await checkRateLimit(rateLimitKey, { maxRequests: 20, windowMs: 60000 })
    
    if (rateLimit.limited) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return Response.json(
        { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.', retryAfter },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // Only admins and company users can scan gift cards
    if (!user.isAdmin && user.role !== 'company') {
      return Response.json(
        { error: 'Keine Berechtigung zum Scannen von Gutscheinen' },
        { status: 403 },
      )
    }

    if (!code) {
      return Response.json({ status: 'invalid', message: 'Kein Code angegeben' }, { status: 400 })
    }

    try {
      // Resolve the company ID for non-admin company users
      let companyId: number | undefined = undefined
      if (user.role === 'company' && !user.isAdmin) {
           const { docs: companies } = await req.payload.find({
               req,
               collection: CompaniesSlug,
               where: { stripeAccountId: { equals: user.connectedAccountId } },
               limit: 1,
               depth: 0
           })
           if (companies.length > 0) {
               companyId = companies[0]!.id
           } else {
               return Response.json({ error: 'Unternehmen nicht gefunden' }, { status: 403 })
           }
      }

      const scanResult = await scanCard({
          identifier: code as string,
          isAdmin: !!user.isAdmin,
          companyId,
          req
      })

      return Response.json({
        status: scanResult.status,
        action: scanResult.action,
        message: scanResult.message,
        card: {
          code: scanResult.code,
          originalValue: scanResult.originalValue,
          remainingBalance: scanResult.remainingBalance,
        },
      })
    } catch (error: any) {
      console.error('Error scanning gift card:', error)
      if (error.message === 'Card not found') {
          return Response.json({ status: 'invalid', message: 'Gutschein nicht gefunden' }, { status: 404 })
      }
       if (error.message === 'Sie können nur Gutscheine Ihres eigenen Unternehmens scannen') {
          return Response.json({ error: error.message }, { status: 403 })
      }
      return Response.json(
        { status: 'error', message: 'Fehler beim Scannen des Gutscheins' },
        { status: 500 },
      )
    }
  },
}

export const giftCardsEndpoints: Endpoint[] = [scanGiftCardEndpoint]
