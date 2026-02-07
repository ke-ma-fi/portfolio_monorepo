import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CompaniesSlug, GiftCardOffersSlug } from '@/slugs'

export async function seedTestDb() {
  const payload = await getPayload({ config: configPromise })

  // 1. Create Test Company
  const company = await payload.create({
    collection: CompaniesSlug,
    data: {
      displayName: 'Test Bäckerei',
      legalName: 'Test Bäckerei GmbH',
      slug: 'test-baeckerei',
      email: 'test@example.com',
      isActive: true,
      stripeAccountId: 'acct_12345', // Mock ID
      chargesEnabled: true,
      commissionRate: 5,
    } as any,
  })

  // 2. Create Test Offer
  const offer = await payload.create({
    collection: GiftCardOffersSlug,
    data: {
      title: '10€ Gutschein',
      price: 10,
      value: 10,
      description: 'Test Gutschein',
      company: company.id,
      isActive: true,
    } as any,
  })

  return { payload, company, offer }
}

export async function createTestCard() {
  const { payload, offer, company } = await seedTestDb()
  
  const card = await payload.create({
    collection: 'gift-cards',
    data: {
      status: 'active',
      isPaid: true,
      offer: offer.id,
      company: company.id,
      originalValue: 10,
      remainingBalance: 10,
      customerEmail: 'e2e-test@example.com',
      // hooks will generate uuid / code
    } as any
  })
  
  return { card, payload }
}
