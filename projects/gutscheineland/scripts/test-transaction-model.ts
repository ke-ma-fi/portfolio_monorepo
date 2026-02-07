import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { createPaymentTransaction } from '../src/services/billing'
import { createLedgerEntry } from '../src/services/billing'

async function testFlow() {
  const payload = await getPayload({ config })

  console.log('--- Starting Transaction Model Test ---')

  // 1. Create a Fake Payment Transaction
  console.log('1. Creating Payment Transaction...')
  try {
      const payment = await createPaymentTransaction({
          payload,
          data: {
              amount: 50.00,
              currency: 'EUR',
              transactionType: 'instore_purchase',
              paymentProvider: 'pos',
              status: 'succeeded',
              company: 1, // Assumes company ID 1 exists. If not, it might fail foreign key check if enforced? 
                         // Payload relationships usually strictly enforce if 'required', but ID check is at DB level.
                         // We might need to fetch a real company first.
              feeStatus: 'open',
          }
      })
      console.log('✅ Payment Transaction Created:', payment.id)
  } catch (e) {
      console.error('❌ Failed to create Payment:', e)
  }

  // 2. Test Ledger Entry (Manual)
  console.log('2. Creating Ledger Entry...')
  try {
      // Find a gift card to attach to?
      // For test, we might fail if no gift card exists.
      // Let's Skip actual creation if we don't have IDs, or try to fetch one.
      const { docs: cards } = await payload.find({ collection: 'gift-cards', limit: 1 })
      if (cards.length > 0 && cards[0]) {
          const card = cards[0]
          const ledger = await createLedgerEntry({
              payload,
              data: {
                  giftcardId: card.id,
                  transactionType: 'correction',
                  amount: 5.00,
                  balanceAfter: (card.remainingBalance || 0) + 5,
                  ownedBy: 1, // Mock
              }
          })
          console.log('✅ Ledger Entry Created:', ledger.id)
      } else {
          console.log('⚠️ No Gift Cards found. Skipping Ledger Test.')
      }
  } catch (e) {
      console.error('❌ Failed to create Ledger Entry:', e)
  }

  process.exit(0)
}

testFlow()
