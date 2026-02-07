import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { fulfillOrder, createCheckoutSession } from '../orders'
import { seedTestDb } from '@/tests/helpers/seed'
import { GiftCardsSlug, GiftCardTransactionsSlug, SettingsSlug } from '@/slugs'
import type Stripe from 'stripe'
import stripe from '@/endpoints/stripe/stripe'

// Mock Stripe
vi.mock('@/endpoints/stripe/stripe', () => ({
  default: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

// Get typed access to the mock
const mockStripeCreate = vi.mocked(stripe.checkout.sessions.create)

describe('Order Fulfillment Service', () => {
  let payload: any
  let offerId: number
  let companyId: number

  beforeAll(async () => {
    const seed = await seedTestDb()
    payload = seed.payload
    offerId = seed.offer.id
    companyId = seed.company.id
  })

  // Note: This suite relies on idempotency checks and database state management
  // at the service level. Unlike the "Create Checkout Session Service" suite,
  // we do not perform per-test cleanup here because fulfillOrder is designed
  // to handle duplicate calls gracefully via transaction idempotency.

  it('should successfully fulfill a standard purchase order', async () => {
    const customerEmail = `test-buyer-${Date.now()}@example.com`
    const stripeSessionId = `sess_${Date.now()}`

    // Mock Session
    const mockSession = {
      id: stripeSessionId,
      amount_total: 1000, // 10.00 EUR
      customer_details: {
        name: 'Max Mustermann',
        email: customerEmail,
        phone: '123456789',
      },
      metadata: {
        offerId: offerId.toString(),
        customerEmail,
        type: 'gift_card_purchase',
        isGift: 'false',
      },
    } as unknown as Stripe.Checkout.Session

    // Spy on Email
    const sendEmailSpy = vi.spyOn(payload, 'sendEmail').mockImplementation(async () => {})

    // Execute
    await fulfillOrder({ payload, session: mockSession })

    // Verify Gift Card Created
    const { docs: cards } = await payload.find({
      collection: GiftCardsSlug,
      where: {
        customerEmail: { equals: customerEmail },
      },
    })
    
    expect(cards).toHaveLength(1)
    const card = cards[0]
    expect(card.status).toBe('active')
    expect(card.isPaid).toBe(true)
    expect(card.remainingBalance).toBe(10) // 10.00 from offer
    expect(card.uuid).toBeDefined()

    // Verify Transaction Logged
    const { docs: transactions } = await payload.find({
      collection: GiftCardTransactionsSlug,
      where: {
        stripeSessionId: { equals: stripeSessionId },
      },
    })
    expect(transactions).toHaveLength(1)
    expect(transactions[0].amountRedeemed).toBe(10)
    expect(transactions[0].transactionType).toBe('purchase')

    // Verify Email Sent
    expect(sendEmailSpy).toHaveBeenCalled()
  })

  it('should handle idempotency (duplicate calls)', async () => {
    const customerEmail = `idempotency-${Date.now()}@example.com`
    const stripeSessionId = `sess_dup_${Date.now()}`

    const mockSession = {
      id: stripeSessionId,
      amount_total: 1000,
      customer_details: { email: customerEmail },
      metadata: {
        offerId: offerId.toString(),
        customerEmail,
        type: 'gift_card_purchase',
      },
    } as unknown as Stripe.Checkout.Session

    // First Call
    await fulfillOrder({ payload, session: mockSession })

    // Second Call
    const consoleSpy = vi.spyOn(console, 'log')
    await fulfillOrder({ payload, session: mockSession })

    // Verify only 1 card exists
    const { docs: cards } = await payload.find({
      collection: GiftCardsSlug,
      where: { customerEmail: { equals: customerEmail } },
    })
    expect(cards).toHaveLength(1)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'))
  })
})

describe('Create Checkout Session Service', () => {
  let payload: any
  let offerId: number
  let companyId: number
  let seedData: { payload: any; company: any; offer: any }
  let createdEntityIds: { companies: number[]; offers: number[] }
  let originalCommissionRate: number | undefined

  beforeAll(async () => {
    seedData = await seedTestDb()
    payload = seedData.payload
    offerId = seedData.offer.id
    companyId = seedData.company.id
  })

  beforeEach(async () => {
    // Reset mock before each test
    vi.clearAllMocks()
    // Initialize tracking for cleanup
    createdEntityIds = { companies: [], offers: [] }
    
    // Capture original commission rate before each test
    try {
      const settings = await payload.findGlobal({
        slug: SettingsSlug,
      })
      originalCommissionRate = settings.defaultCommissionRate
    } catch (e) {
      // Settings might not exist yet
      originalCommissionRate = undefined
    }
  })

  afterEach(async () => {
    // Cleanup test data created during this test
    for (const offerId of createdEntityIds.offers) {
      try {
        await payload.delete({
          collection: 'gift-card-offers',
          id: offerId,
        })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    for (const companyId of createdEntityIds.companies) {
      try {
        await payload.delete({
          collection: 'companies',
          id: companyId,
        })
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Restore original commission rate
    if (originalCommissionRate !== undefined) {
      try {
        await payload.updateGlobal({
          slug: SettingsSlug,
          data: {
            defaultCommissionRate: originalCommissionRate,
          },
        })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  })

  it('should validate required fields', async () => {
    await expect(
      createCheckoutSession({
        offerId: 0,
        email: '',
      })
    ).rejects.toThrow('Missing required fields')
  })

  it('should validate gifting inputs when isGift is true', async () => {
    await expect(
      createCheckoutSession({
        offerId,
        email: 'buyer@example.com',
        gifting: {
          isGift: true,
          recipientName: '',
          recipientEmail: '',
        },
      })
    ).rejects.toThrow('Recipient name and email are required for gifts')

    await expect(
      createCheckoutSession({
        offerId,
        email: 'buyer@example.com',
        gifting: {
          isGift: true,
          recipientName: 'John Doe',
          recipientEmail: '',
        },
      })
    ).rejects.toThrow('Recipient name and email are required for gifts')

    await expect(
      createCheckoutSession({
        offerId,
        email: 'buyer@example.com',
        gifting: {
          isGift: true,
          recipientName: '',
          recipientEmail: 'recipient@example.com',
        },
      })
    ).rejects.toThrow('Recipient name and email are required for gifts')
  })

  it('should compute application_fee_amount correctly with company-specific commission rate', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_test',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
    })

    const expectedApplicationFeeAmount = Math.round(
      seedData.offer.price * 100 * (seedData.company.commissionRate / 100)
    )

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: expect.objectContaining({
          application_fee_amount: expectedApplicationFeeAmount,
        }),
      })
    )
  })

  it('should compute application_fee_amount correctly with global default commission rate', async () => {
    // Create a company without a commission rate override
    const companyNoRate = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'No Rate Company',
        legalName: 'No Rate Company GmbH',
        slug: 'no-rate-company',
        email: 'noRate@example.com',
        isActive: true,
        stripeAccountId: 'acct_67890',
        chargesEnabled: true,
        // No commissionRate set
      },
    })
    createdEntityIds.companies.push(companyNoRate.id)

    const offerNoRate = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '20€ Gutschein',
        price: 20,
        value: 20,
        description: 'Test Gutschein',
        company: companyNoRate.id,
        isActive: true,
      },
    })
    createdEntityIds.offers.push(offerNoRate.id)

    // Set global default commission rate to 7%
    const testCommissionRate = 7
    await payload.updateGlobal({
      slug: SettingsSlug,
      data: {
        defaultCommissionRate: testCommissionRate,
      },
    })

    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_test_global',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId: offerNoRate.id,
      email: 'buyer@example.com',
    })

    const expectedApplicationFeeAmount = Math.round(
      offerNoRate.price * 100 * (testCommissionRate / 100)
    )

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: expect.objectContaining({
          application_fee_amount: expectedApplicationFeeAmount, // 7% global default rate (set above) of 2000 cents (20 EUR)
        }),
      })
    )
  })

  it('should persist expected metadata in Stripe session for standard purchase', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_metadata_test',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
    })

    const expectedApplicationFeeAmount = Math.round(
      seedData.offer.price * 100 * (seedData.company.commissionRate / 100)
    )

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          offerId: offerId.toString(),
          customerEmail: 'buyer@example.com',
          type: 'gift_card_purchase',
          applicationFee: expectedApplicationFeeAmount.toString(),
          isGift: 'false',
          recipientName: '',
          recipientEmail: '',
          message: '',
          existingCardUuid: '',
        }),
      })
    )
  })

  it('should persist expected metadata in Stripe session for gift purchase', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_gift_metadata_test',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
      gifting: {
        isGift: true,
        recipientName: 'Jane Doe',
        recipientEmail: 'jane@example.com',
        message: 'Happy Birthday!',
      },
    })

    const expectedApplicationFeeAmount = Math.round(
      seedData.offer.price * 100 * (seedData.company.commissionRate / 100)
    )

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          offerId: offerId.toString(),
          customerEmail: 'buyer@example.com',
          type: 'gift_card_purchase',
          applicationFee: expectedApplicationFeeAmount.toString(),
          isGift: 'true',
          recipientName: 'Jane Doe',
          recipientEmail: 'jane@example.com',
          message: 'Happy Birthday!',
          existingCardUuid: '',
        }),
      })
    )
  })

  it('should include existingCardUuid in metadata when provided', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_existing_card_test',
      url: 'https://checkout.stripe.com/test',
    })

    const existingUuid = 'test-uuid-12345'

    await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
      existingCardUuid: existingUuid,
    })

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          existingCardUuid: existingUuid,
        }),
      })
    )
  })

  it('should configure correct Stripe Checkout Session settings', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_config_test',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
    })

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: 'buyer@example.com',
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'eur',
              unit_amount: expect.any(Number),
            }),
            quantity: 1,
          }),
        ]),
        payment_intent_data: expect.objectContaining({
          transfer_data: expect.objectContaining({
            destination: expect.any(String),
          }),
        }),
        success_url: expect.stringContaining('/order/success'),
        cancel_url: expect.stringContaining('/buy/'),
      })
    )
  })

  it('should handle invalid offer ID', async () => {
    await expect(
      createCheckoutSession({
        offerId: 99999,
        email: 'buyer@example.com',
      })
    ).rejects.toThrow('Offer not found')
  })

  it('should handle incomplete merchant payment setup - missing stripeAccountId', async () => {
    const incompleteCompany = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'Incomplete Company',
        legalName: 'Incomplete Company GmbH',
        slug: 'incomplete-company',
        email: 'incomplete@example.com',
        isActive: true,
        // Missing stripeAccountId
        chargesEnabled: true,
      },
    })
    createdEntityIds.companies.push(incompleteCompany.id)

    const incompleteOffer = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '15€ Gutschein',
        price: 15,
        value: 15,
        description: 'Test Gutschein',
        company: incompleteCompany.id,
        isActive: true,
      },
    })
    createdEntityIds.offers.push(incompleteOffer.id)

    await expect(
      createCheckoutSession({
        offerId: incompleteOffer.id,
        email: 'buyer@example.com',
      })
    ).rejects.toThrow('Merchant payment setup incomplete')
  })

  it('should handle incomplete merchant payment setup - charges not enabled', async () => {
    const notEnabledCompany = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'Not Enabled Company',
        legalName: 'Not Enabled Company GmbH',
        slug: 'not-enabled-company',
        email: 'notenabled@example.com',
        isActive: true,
        stripeAccountId: 'acct_11111',
        chargesEnabled: false,
      },
    })
    createdEntityIds.companies.push(notEnabledCompany.id)

    const notEnabledOffer = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '25€ Gutschein',
        price: 25,
        value: 25,
        description: 'Test Gutschein',
        company: notEnabledCompany.id,
        isActive: true,
      },
    })
    createdEntityIds.offers.push(notEnabledOffer.id)

    await expect(
      createCheckoutSession({
        offerId: notEnabledOffer.id,
        email: 'buyer@example.com',
      })
    ).rejects.toThrow('Merchant payment setup incomplete')
  })

  it('should return checkout URL on success', async () => {
    const mockUrl = 'https://checkout.stripe.com/test-session-url'
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_url_test',
      url: mockUrl,
    })

    const result = await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
    })

    expect(result).toEqual({ url: mockUrl })
  })

  it('should allow gifting parameters when isGift is false', async () => {
    // This documents that gifting params are ignored when isGift is false
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_test_gifting_false',
      url: 'https://checkout.stripe.com/test',
    })

    await expect(
      createCheckoutSession({
        offerId,
        email: 'buyer@example.com',
        gifting: {
          isGift: false,
          recipientName: 'Should be ignored',
          recipientEmail: 'ignored@example.com',
        },
      })
    ).resolves.toBeDefined()

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          isGift: 'false',
        }),
      })
    )
  })

  it('should handle Stripe API errors', async () => {
    const stripeError = new Error('Stripe API error: Invalid account')
    mockStripeCreate.mockRejectedValueOnce(stripeError)

    await expect(
      createCheckoutSession({
        offerId,
        email: 'buyer@example.com',
      })
    ).rejects.toThrow('Stripe API error: Invalid account')
  })

  it('should handle inactive companies', async () => {
    const inactiveCompany = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'Inactive Company',
        legalName: 'Inactive Company GmbH',
        slug: 'inactive-company',
        email: 'inactive@example.com',
        isActive: false,
        stripeAccountId: 'acct_inactive',
        chargesEnabled: true,
        commissionRate: 5,
      },
    })
    createdEntityIds.companies.push(inactiveCompany.id)

    const inactiveOffer = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '30€ Gutschein',
        price: 30,
        value: 30,
        description: 'Test Gutschein',
        company: inactiveCompany.id,
        isActive: true,
      },
    })
    createdEntityIds.offers.push(inactiveOffer.id)

    // The service doesn't currently validate company.isActive, so this should succeed
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_inactive_company',
      url: 'https://checkout.stripe.com/test',
    })

    await expect(
      createCheckoutSession({
        offerId: inactiveOffer.id,
        email: 'buyer@example.com',
      })
    ).resolves.toBeDefined()
  })

  it('should handle inactive offers', async () => {
    const inactiveOffer = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '35€ Gutschein',
        price: 35,
        value: 35,
        description: 'Test Gutschein',
        company: companyId,
        isActive: false,
      },
    })
    createdEntityIds.offers.push(inactiveOffer.id)

    // The service doesn't currently validate offer.isActive, so this should succeed
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_inactive_offer',
      url: 'https://checkout.stripe.com/test',
    })

    await expect(
      createCheckoutSession({
        offerId: inactiveOffer.id,
        email: 'buyer@example.com',
      })
    ).resolves.toBeDefined()
  })

  it('should correctly round decimal commission rates and prices', async () => {
    const decimalCompany = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'Decimal Company',
        legalName: 'Decimal Company GmbH',
        slug: 'decimal-company',
        email: 'decimal@example.com',
        isActive: true,
        stripeAccountId: 'acct_decimal',
        chargesEnabled: true,
        commissionRate: 5.5, // Non-round commission rate
      },
    })
    createdEntityIds.companies.push(decimalCompany.id)

    const decimalOffer = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '10.01€ Gutschein',
        price: 10.01, // Non-round price
        value: 10.01,
        description: 'Test Gutschein',
        company: decimalCompany.id,
        isActive: true,
      },
    })
    createdEntityIds.offers.push(decimalOffer.id)

    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_decimal',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId: decimalOffer.id,
      email: 'buyer@example.com',
    })

    // 10.01 EUR = 1001 cents, 5.5% = 55.055 cents, Math.round = 55 cents
    const expectedFee = Math.round(10.01 * 100 * (5.5 / 100))
    expect(expectedFee).toBe(55) // Verify rounding behavior

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: expect.objectContaining({
          application_fee_amount: expectedFee,
        }),
      })
    )
  })

  it('should handle null URL from Stripe', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_no_url',
      url: null, // According to Stripe types, URL can be null in certain edge cases
    })

    const result = await createCheckoutSession({
      offerId,
      email: 'buyer@example.com',
    })

    // The service currently doesn't handle null URL, it just returns it
    expect(result).toEqual({ url: null })
  })

  it('should use fallback commission rate when settings fetch fails', async () => {
    // Create company without commission rate
    const noRateCompany = await payload.create({
      collection: 'companies',
      data: {
        displayName: 'Fallback Test Company',
        legalName: 'Fallback Test Company GmbH',
        slug: 'fallback-test-company',
        email: 'fallback@example.com',
        isActive: true,
        stripeAccountId: 'acct_fallback',
        chargesEnabled: true,
        // No commissionRate set
      },
    })
    createdEntityIds.companies.push(noRateCompany.id)

    const fallbackOffer = await payload.create({
      collection: 'gift-card-offers',
      data: {
        title: '40€ Gutschein',
        price: 40,
        value: 40,
        description: 'Test Gutschein',
        company: noRateCompany.id,
        isActive: true,
      },
    })
    createdEntityIds.offers.push(fallbackOffer.id)

    // Mock findGlobal to throw an error using vi.spyOn
    const findGlobalSpy = vi.spyOn(payload, 'findGlobal').mockRejectedValueOnce(new Error('Settings not found'))

    mockStripeCreate.mockResolvedValueOnce({
      id: 'sess_fallback',
      url: 'https://checkout.stripe.com/test',
    })

    await createCheckoutSession({
      offerId: fallbackOffer.id,
      email: 'buyer@example.com',
    })

    // Fallback rate is 5% (from service function line 301)
    const expectedFee = Math.round(40 * 100 * (5 / 100))
    expect(expectedFee).toBe(200)

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: expect.objectContaining({
          application_fee_amount: expectedFee,
        }),
      })
    )

    // Restore original function
    findGlobalSpy.mockRestore()
  })
})
