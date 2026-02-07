import { Payload, PayloadRequest } from 'payload'
import crypto from 'crypto'
import { PaymentTransactionsSlug, InvoicesSlug } from '@/slugs'

interface CreateInvoiceOptions {
  companyId: string | number
  payload: Payload
  req?: PayloadRequest
}

export async function createInvoiceForCompany({ companyId, payload, req }: CreateInvoiceOptions) {
  console.log(`[Billing] Starting run for company ${companyId}`)

  // Step 1: Query open payment transactions
  const { docs: transactions } = await payload.find({
    collection: PaymentTransactionsSlug,
    req,
    overrideAccess: true,
    where: {
      and: [
        {
          feeStatus: {
            equals: 'open',
          },
        },
        {
          status: {
            equals: 'succeeded',
          },
        },
        {
          company: {
            equals: companyId,
          },
        },
      ],
    },
    limit: 1000, // Reasonable batch size
  })

  if (transactions.length === 0) {
    console.log(`[Billing] No open transactions found for company ${companyId}`)
    return null
  }

  // Step 2: Aggregate Platform Fees
  let totalAmount = 0
  const transactionIds: string[] = []

  for (const tx of transactions) {
    // Only count the platform fee towards the invoice
    const fee = tx.platformFee || 0
    totalAmount += fee
    const txId = tx.id as any
    transactionIds.push(txId.toString())
  }

  if (totalAmount <= 0) {
     console.log(`[Billing] Total fee amount is 0. Skipping invoice.`)
     return null
  }

  // Generate secure invoice number with timestamp and random component
  const year = new Date().getFullYear()
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase()
  const invoiceNumber = `INV-${year}-${timestamp}-${randomBytes}`

  // Step 3: Create Invoice
  const invoice = await payload.create({
    collection: InvoicesSlug,
    req,
    overrideAccess: true,
    data: {
      company: companyId,
      invoiceNumber,
      totalAmount,
      status: 'draft', // Draft until synced or finalized
      transactionCount: transactions.length,
      periodStart: new Date().toISOString(), // Roughly now
      periodEnd: new Date().toISOString(),
      details: {
        transactionIds,
      },
    } as any, 
  })

  // Step 4: Update Payment Transactions
  // Mark them as invoiced and link to invoice
  await payload.update({
    collection: PaymentTransactionsSlug,
    req,
    overrideAccess: true,
    where: {
      id: {
        in: transactionIds,
      },
    },
    data: {
      feeStatus: 'invoiced',
      invoice: invoice.id,
    } as any,
  })

  console.log(`[Billing] Created Invoice ${invoice.id} for ${totalAmount}€ covering ${transactions.length} items.`)
  return invoice
}
