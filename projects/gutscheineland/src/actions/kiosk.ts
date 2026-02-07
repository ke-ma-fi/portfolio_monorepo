'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { CompaniesSlug } from '@/slugs'
import { activateCardInStore } from '@/services/kiosk'

// Helper to get authenticated company user
async function getAuthenticatedCompanyUser() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || user.role !== 'company') {
    return { user: null, error: 'Unauthorized', status: 401 }
  }

  // Find the company associated with the user
  const userCompany = await payload.find({
    collection: CompaniesSlug,
    where: {
      stripeAccountId: {
        equals: user.connectedAccountId,
      },
    },
    limit: 1,
  })

  if (!userCompany.docs.length) {
    return { user, company: null, error: 'Company not found', status: 403 }
  }

  return { user, company: userCompany.docs[0], payload }
}

export async function activateCardAction(code: string, options?: { customerEmail?: string }) {
  try {
    const { company, payload, error, status } = await getAuthenticatedCompanyUser()
    if (error) return { error, status }
    if (!company) return { error: 'Company not found', status: 403 }

    const result = await activateCardInStore({
      code,
      companyId: company.id,
      customerEmail: options?.customerEmail,
      req: { payload } as any // Pass payload as pseudo-request
    })

    return {
      success: true,
      data: result,
    }

  } catch (error: any) {
    console.error('Activation Error:', error)
    return { error: error.message || 'Internal Server Error', status: 500 }
  }
}
