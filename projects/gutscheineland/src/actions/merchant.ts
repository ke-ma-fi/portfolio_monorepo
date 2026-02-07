'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { CompaniesSlug } from '@/slugs'
import { scanCard, redeemCard } from '@/services/merchant'

// Helper to resolve company
async function resolveCompany(payload: any, user: any) {
    if (user.role === 'company') {
        const userCompany = await payload.find({
            collection: CompaniesSlug,
            where: {
              stripeAccountId: {
                equals: user.connectedAccountId,
              },
            },
            limit: 1,
        })
        return userCompany.docs[0] || null
    }
    return null
}

export async function scanCardAction(identifier: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return { error: 'Unauthorized', status: 401 }
    }

    // Only admins and company users can scan gift cards
    if (!user.isAdmin && user.role !== 'company') {
      return { error: 'Keine Berechtigung zum Scannen von Gutscheinen', status: 403 }
    }

    if (!identifier) {
      return { error: 'Identifier (UUID or Code) required', status: 400 }
    }

    let companyId = undefined
    if (user.role === 'company' && !user.isAdmin) {
        const company = await resolveCompany(payload, user)
        if (!company) return { error: 'Unternehmen nicht gefunden', status: 403 }
        companyId = company.id
    }

    const result = await scanCard({
        identifier,
        companyId,
        isAdmin: user.isAdmin || false, // Pass if admin
        req: { payload } as any
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Internal Error', status: 500 }
  }
}

export async function redeemCardAction(uuid: string, amount: number) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return { error: 'Unauthorized', status: 401 }
    }

    // Only admins and company users can redeem gift cards
    if (!user.isAdmin && user.role !== 'company') {
      return { error: 'Keine Berechtigung zum Einlösen von Gutscheinen', status: 403 }
    }

    if (!uuid || !amount || typeof amount !== 'number' || amount <= 0) {
      return { error: 'Invalid data', status: 400 }
    }

    let companyId = undefined
    if (user.role === 'company' && !user.isAdmin) {
        const company = await resolveCompany(payload, user)
        if (!company) return { error: 'Unternehmen nicht gefunden', status: 403 }
        companyId = company.id
    }

    const result = await redeemCard({
        uuid,
        amount,
        userId: user.id,
        companyId,
        isAdmin: user.isAdmin || false,
        req: { payload } as any
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('Redeem Error:', error)
    if (error.message?.includes('RACE_CONDITION')) {
        return { error: error.message.replace('RACE_CONDITION: ', ''), status: 409 }
    }
    return { error: error.message || 'Internal Error', status: 500 }
  }
}
