export * from './createInvoice'
import { Payload, PayloadRequest } from 'payload'
import { GiftCardTransactionsSlug, PaymentTransactionsSlug, CompaniesSlug, SettingsSlug } from '@/slugs'
import { GiftCard, Company } from '@/payload-types'

interface CalculateFeesOptions {
  payload: Payload
  companyCommissionRate?: number | null
  amount: number // in currency units (e.g. 50.00)
}

interface CreateLedgerEntryOptions {
  payload: Payload
  req?: PayloadRequest
  data: {
    giftcardId: number
    transactionType: 'initial_credit' | 'redemption' | 'correction' | 'void'
    amount: number
    balanceAfter: number
    company?: number
    ownedBy?: number
  }
}

interface CreatePaymentTransactionOptions {
  payload: Payload
  req?: PayloadRequest
  data: {
    amount: number
    currency?: string
    transactionType: 'online_purchase' | 'instore_purchase' | 'refund'
    status?: 'succeeded' | 'pending' | 'failed'
    paymentProvider: 'stripe' | 'pos' | 'cash' | 'manual'
    stripeSessionId?: string
    platformFee?: number
    netAmount?: number
    feeStatus?: 'paid_via_stripe' | 'open' | 'invoiced' | 'waived' | 'not_applicable'
    relatedGiftCard?: number
    company: number
    customer?: number
    invoice?: number
    ownedBy?: number
  }
}

/**
 * Calculate application fees based on company rate or global default
 */
export async function calculateFees({
  payload,
  companyCommissionRate,
  amount,
}: CalculateFeesOptions) {
  let rate = companyCommissionRate

  if (rate === undefined || rate === null) {
    try {
      // @ts-ignore - typings might be loose for global
      const settings = await payload.findGlobal({
        slug: SettingsSlug,
      })
      rate = settings?.defaultCommissionRate ?? 5
    } catch (error) {
      console.warn('Could not fetch global settings, using fallback rate 5%', error)
      rate = 5
    }
  }

  const amountInCents = Math.round(amount * 100)
  const applicationFeeInCents = Math.round(amountInCents * ((rate as number) / 100))

  return {
    rate: rate as number,
    applicationFeeInCents,
    applicationFee: applicationFeeInCents / 100,
  }
}

/**
 * Create a transaction record in the database
 */
/**
 * Create a ledger entry (GiftCardTransaction)
 */
export async function createLedgerEntry({ payload, req, data }: CreateLedgerEntryOptions) {
  try {
    const transaction = await payload.create({
      req,
      collection: GiftCardTransactionsSlug,
      overrideAccess: true,
      data: {
        giftcard: data.giftcardId,
        transactionType: data.transactionType,
        amount: data.amount,
        balanceAfter: data.balanceAfter,
        company: data.company, 
        ownedBy: data.ownedBy, 
      },
    })
    return transaction
  } catch (error) {
    console.error('Failed to create ledger entry:', error)
    throw error
  }
}

/**
 * Create a payment transaction
 */
export async function createPaymentTransaction({ payload, req, data }: CreatePaymentTransactionOptions) {
  try {
    const transaction = await payload.create({
      req,
      collection: PaymentTransactionsSlug,
      overrideAccess: true,
      data: {
        amount: data.amount,
        currency: data.currency || 'EUR',
        transactionType: data.transactionType,
        status: data.status || 'succeeded',
        paymentProvider: data.paymentProvider,
        stripeSessionId: data.stripeSessionId,
        platformFee: data.platformFee,
        netAmount: data.netAmount,
        feeStatus: data.feeStatus,
        relatedGiftCard: data.relatedGiftCard,
        company: data.company,
        customer: data.customer,
        invoice: data.invoice,
        ownedBy: data.ownedBy,
      },
    })
    return transaction
  } catch (error) {
    console.error('Failed to create payment transaction:', error)
    throw error
  }
}

interface InStoreTransactionOptions {
  req?: PayloadRequest
  payload?: Payload
  card: Partial<GiftCard> & { id: number; code?: string | null; originalValue?: number | null }
  companyId?: number | Company
}

export async function createInStoreTransaction({ req, payload: payloadArg, card, companyId }: InStoreTransactionOptions) {
  const payload = payloadArg || req?.payload
  if (!payload) throw new Error('Missing payload in createInStoreTransaction')
  
  // 1. Fetch Company for Commission Rate
  const cid = typeof companyId === 'object' ? companyId.id : companyId
  if (!cid) return

  const company = await payload.findByID({
    req,
    collection: CompaniesSlug,
    id: cid,
  }) as Company

  if (!company) return

  // Default 5% if not set
  const commissionRate = (company.commissionRate ?? 5) / 100
  const amount = card.originalValue || 0
  const fee = amount * commissionRate

  // 2. Create Transaction
  const ownerId = company.ownedBy
    ? (typeof company.ownedBy === 'object' ? company.ownedBy.id : company.ownedBy)
    : undefined

  if (!ownerId) {
      console.error(`[In-Store Purchase] Cannot record transaction: Company ${cid} has no owner.`)
      return
  }

  await createPaymentTransaction({
    payload: payload,
    req,
    data: {
        amount: amount,
        company: cid,
        relatedGiftCard: card.id,
        // In-Store Purchase via scanner -> manual/pos
        transactionType: 'instore_purchase',
        paymentProvider: 'pos', // Assumed POS/Cash
        feeStatus: 'open',
        platformFee: fee,
        netAmount: amount - fee,
        ownedBy: ownerId,
        customer: typeof card.buyer === 'number' ? card.buyer : (card.buyer as any)?.id // If defined
    },
  })

  console.log(`[In-Store Purchase] Recorded transaction for card ${card.code}. Fee: ${fee}`)
}

interface SyncCardToLedgerOptions {
  req: PayloadRequest
  card: GiftCard
  previousCard?: GiftCard
  operation: 'create' | 'update' | 'delete' | 'read'
}

/**
 * Synchronize Gift Card state to Ledger (GiftCardTransactions)
 * Handles Initial Credit, Redemptions, and Corrections.
 */
export async function syncCardToLedger({ req, card, previousCard, operation }: SyncCardToLedgerOptions) {
  // Helper to get Owner ID from Company
  const getOwnerId = async (companyOrId: number | Company): Promise<number | undefined> => {
      let company: Company | undefined;
      
      if (typeof companyOrId === 'object') {
          // Check if ownedBy is populated or just available
          // In Payload types, it might be (number | null) | User
          if (!companyOrId.ownedBy) {
             // If missing in object, re-fetch
             company = await req.payload.findByID({
                  req,
                  collection: CompaniesSlug,
                  id: companyOrId.id,
              }) as Company
          } else {
             company = companyOrId;
          }
      } else {
          // It's an ID
          company = await req.payload.findByID({
              req,
              collection: CompaniesSlug,
              id: companyOrId,
          }) as Company
      }

      if (!company || !company.ownedBy) return undefined;
      
      return typeof company.ownedBy === 'object' ? company.ownedBy.id : company.ownedBy;
  }

  // Optimize: Check if card already has ownedBy (from create or depth)
  const resolveOwner = async (): Promise<number | undefined> => {
      if (card.ownedBy) {
          return typeof card.ownedBy === 'object' ? card.ownedBy.id : card.ownedBy
      }
      if (card.company) {
          return await getOwnerId(card.company)
      }
      return undefined
  }

  // 1. Initial Credit (Creation OR Activation)
  // Logic: Ensure we only initialize ledger if card is ACTIVE.
  
  const isActivating = operation === 'update' && previousCard?.status === 'inactive' && card.status === 'active';
  const isCreationActive = operation === 'create' && card.status === 'active';
  
  if (isCreationActive || isActivating) {
      if (card.remainingBalance && card.remainingBalance > 0) {
        if (!card.company) return; 
        const ownerId = await resolveOwner();

        await createLedgerEntry({
            payload: req.payload,
            req,
            data: {
                giftcardId: card.id,
                transactionType: 'initial_credit',
                amount: card.remainingBalance,
                balanceAfter: card.remainingBalance,
                company: typeof card.company === 'object' ? card.company.id : card.company,
                ownedBy: ownerId,
            }
        })
      }
      return
  }

  // 2. Balance Change (for cards that were Active before this update, and NOT activating this turn)
  if (operation === 'update' && previousCard && previousCard.status === 'active' && !isActivating) {
    const oldBalance = previousCard.remainingBalance || 0
    const newBalance = card.remainingBalance || 0
    const delta = newBalance - oldBalance

    if (delta !== 0) {
        if (!card.company) return; 
        const ownerId = await resolveOwner();
        const type = delta < 0 ? 'redemption' : 'correction'
        
        await createLedgerEntry({
            payload: req.payload,
            req,
            data: {
                giftcardId: card.id,
                transactionType: type,
                amount: delta,
                balanceAfter: newBalance,
                company: typeof card.company === 'object' ? card.company.id : card.company,
                ownedBy: ownerId,
            }
        })
    }
  }
}
