import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PaymentTransactionsSlug } from '@/slugs'

async function cleanupDuplicates() {
  const payload = await getPayload({ config: configPromise })
  console.log('Starting cleanup of duplicate payment transactions...')

  // 1. Fetch all payment transactions
  // For a large DB this should be paginated, but for dev cleanup 1000 is likely enough
  const { docs: transactions } = await payload.find({
    collection: PaymentTransactionsSlug,
    limit: 1000,
    pagination: false,
  })

  console.log(`Found ${transactions.length} total payment transactions.`)

  // 2. Group by stripeSessionId
  const groups: Record<string, typeof transactions> = {}
  
  for (const txn of transactions) {
    if (txn.stripeSessionId) {
      if (!groups[txn.stripeSessionId]) {
        groups[txn.stripeSessionId] = []
      }
      groups[txn.stripeSessionId]!.push(txn)
    }
  }

  // 3. Identify duplicates
  let deletedCount = 0
  for (const [sessionId, txns] of Object.entries(groups)) {
    if (txns.length > 1) {
      console.log(`Found ${txns.length} duplicates for session ${sessionId}`)
      
      // Sort by creation time (keep oldest? or keep newest? usually keep oldest as "original")
      // Sort ascending date
      txns.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      
      // Keep [0], delete rest
      const toDelete = txns.slice(1)
      
      for (const txn of toDelete) {
        await payload.delete({
          collection: PaymentTransactionsSlug,
          id: txn.id,
        })
        console.log(`Deleted duplicate txn ${txn.id}`)
        deletedCount++
      }
    }
  }

  console.log(`Cleanup complete. Removed ${deletedCount} duplicate payment transactions.`)
  process.exit(0)
}

cleanupDuplicates().catch((err) => {
    console.error(err)
    process.exit(1)
})
