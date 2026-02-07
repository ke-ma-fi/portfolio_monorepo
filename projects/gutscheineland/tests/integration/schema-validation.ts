import configPromise from '../../src/payload.config'
import { getPayload } from 'payload'

async function testLayer1() {
  console.log('🏁 Starting Layer 1 Schema Validation...')

  const payload = await getPayload({ config: configPromise })

  try {
    // 1. Setup Dependencies (Company & Offer)
    console.log('   Creating dummy Company...')
    const company = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'Test Bakery',
        legalName: 'Test Bakery',
        stripeAccountId: 'acct_123',
      },
    })

    console.log('   Creating dummy Offer...')
    const offer = await payload.create({
      collection: 'gift-card-offers',
      draft: false,
      data: {
        title: 'Sourdough Special',
        value: 50,
        price: 50,
        company: company.id,
        description: 'Test offer',
        expiryDurationDays: 365,
      },
    })

    // 2. Create Customer (The new Collection)
    console.log('   Creating Customer...')
    const customerEmail = `guest-${Date.now()}@example.com`
    const customer = await payload.create({
      collection: 'customers',
      data: {
        email: customerEmail,
        firstName: 'Guest',
        lastName: 'User',
      },
    })
    console.log('   ✅ Customer created:', customer.id)

    // 3. Create Gift Card (The Core Test)
    console.log('   Creating Gift Card...')
    const giftCard = await payload.create({
      collection: 'gift-cards',
      draft: false,
      data: {
        company: company.id,
        offer: offer.id,
        originalValue: 50,
        remainingBalance: 50,
        customerEmail: customerEmail, // The new field
        buyer: customer.id, // The optional link
        status: 'active',
        // uuid is NOT provided here, should be auto-generated
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })

    // 4. Assertions
    console.log('\n🔎 Validating Results:')

    if (giftCard.uuid) {
      console.log(`   ✅ UUID generated: ${giftCard.uuid}`)
    } else {
      console.error('   ❌ FAILED: UUID was not generated!')
      process.exit(1)
    }

    if (giftCard.customerEmail === customerEmail) {
      console.log(`   ✅ Customer Email stored: ${giftCard.customerEmail}`)
    } else {
      console.error('   ❌ FAILED: Customer Email mismatch!')
      process.exit(1)
    }

    console.log('\n🎉 Layer 1 Validation PASSED!')
    
    // Cleanup (Optional, but good practice)
    // await payload.delete(...) 

  } catch (error) {
    console.error('\n❌ Test Failed:', error)
    process.exit(1)
  }
  process.exit(0)
}

testLayer1()
