import { PayloadRequest } from 'payload'
import { getServicePayload } from '@/services/baseService'
import { CompaniesSlug, GiftCardsSlug, UsersSlug } from '@/slugs'
import { GiftCard } from '@/payload-types'
import stripe from '@/endpoints/stripe/stripe'

interface ScanCardOptions {
  identifier: string
  companyId?: number // If provided, strictly enforces ownership
  isCompanyAdmin?: boolean // If true, bypasses checks? No, admins bypass.
  isAdmin?: boolean // Payload Admin
  req?: PayloadRequest
}

export async function scanCard({ identifier, companyId, isAdmin, req }: ScanCardOptions) {
  const payload = await getServicePayload({ req })

  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: {
      or: [
        { recipientUuid: { equals: identifier } },
        { code: { equals: identifier } },
      ],
    },
    depth: 1,
    overrideAccess: true,
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }

  const card = cards[0] as GiftCard

  // Authorization Check: Admin can scan any card; non-admin MUST have companyId and can only scan their own
  if (!isAdmin) {
      if (!companyId) {
        throw new Error('Unauthorized: Company ID required for non-admin users')
      }
      const cardCompanyId = typeof card.company === 'object' ? card.company?.id : card.company
      if (!cardCompanyId || cardCompanyId !== companyId) {
        throw new Error('Sie können nur Gutscheine Ihres eigenen Unternehmens scannen')
      }
  }

  // Status Logic
  let status = card.status || 'unknown'
  let message = ''
  let action: string

  if (!card.isPaid) {
    status = 'inactive'
    message = 'Gutschein ist noch nicht bezahlt'
    action = 'activate'
  } else if (status === 'expired') {
    message = 'Gutschein ist abgelaufen'
    action = 'none'
  } else if (status === 'redeemed') {
    message = 'Gutschein wurde bereits vollständig eingelöst'
    action = 'none'
  } else {
    status = 'active'
    message = 'Gutschein ist bereit zum Einlösen'
    action = 'use'
  }

  return {
    code: card.code,
    remainingBalance: card.remainingBalance || 0,
    status,
    expiryDate: card.expiryDate || null,
    uuid: card.uuid || '',
    action,
    message,
    originalValue: card.originalValue,
  }
}

interface RedeemCardOptions {
  uuid: string
  amount: number
  userId: number // User performing the action (for audit)
  companyId?: number // Enforce ownership
  isAdmin?: boolean
  req?: PayloadRequest
}

export async function redeemCard({ uuid, amount, userId, companyId, isAdmin, req }: RedeemCardOptions) {
  const payload = await getServicePayload({ req })

  if (amount <= 0) {
    throw new Error('Invalid amount')
  }

  // 1. Fetch current card state
  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: {
      uuid: { equals: uuid },
    },
    depth: 1,
    overrideAccess: true,
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }

  const card = cards[0] as GiftCard

  // Authorization Check: Admin can redeem any card; non-admin MUST have companyId and can only redeem their own
  if (!isAdmin) {
      if (!companyId) {
        throw new Error('Unauthorized: Company ID required for non-admin users')
      }
      const cardCompanyId = typeof card.company === 'object' ? card.company?.id : card.company
      if (!cardCompanyId || cardCompanyId !== companyId) {
        throw new Error('Sie können nur Gutscheine Ihres eigenen Unternehmens einlösen')
      }
  }

  if (card.status !== 'active') {
    throw new Error('Card is not active')
  }

  const currentBalance = card.remainingBalance || 0
  if (currentBalance < amount) {
    throw new Error('Insufficient balance')
  }

  const newBalance = currentBalance - amount
  const newStatus = newBalance === 0 ? 'redeemed' : 'active'
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentVersion = (card as any).lockVersion || 0

  // 2. ATOMIC UPDATE (Optimistic Locking)
  const result = await payload.update({
    req,
    collection: GiftCardsSlug,
    overrideAccess: true, // Service layer has already performed authorization checks
    where: {
      and: [
        { id: { equals: card.id } },
        { lockVersion: { equals: currentVersion } },
      ],
    },
    data: {
      remainingBalance: newBalance,
      status: newStatus,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lockVersion: currentVersion + 1 as any,
    },
  })

  // 3. Check for Collision
  if (result.docs.length === 0) {
    // Return a specific error object or throw a specific error that the action can catch
    // For simplicity in service layer, we throw an error with a specific message or code
    // The caller can try-catch.
    throw new Error('RACE_CONDITION: Transaktion fehlgeschlagen: Die Karte wurde gerade anderswo aktualisiert. Bitte versuchen Sie es erneut.')
  }

  const updatedCard = result.docs[0] as GiftCard
  
  // Note: The GiftCard 'afterChange' hook (recordLedgerEntry) is responsible for
  // detecting balance changes on the card and creating the corresponding ledger entry
  // according to its own logic (e.g. depending on card status). We do NOT manually
  // create a GiftCardTransaction here anymore.

  return {
    newBalance: updatedCard.remainingBalance,
    status: updatedCard.status,
  }
}

interface HandleStripeUpdateOptions {
  req: PayloadRequest
  account: any // Stripe Account Object
}

export async function handleStripeAccountUpdate({ req, account }: HandleStripeUpdateOptions) {
    console.log(`Processing account.updated for ${account.id}`)

    const UpdateData: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      stripeAccountId: account.id,
      businessType: account.business_type,
      legalName: account.business_profile?.name,
      businessProfile: {
        websiteUrl: account.business_profile?.url,
        mcc: account.business_profile?.mcc,
      },
      bankInfo: {
        last4: account.external_accounts?.data?.[0]?.last4,
        bankName: account.external_accounts?.data?.[0]?.bank_name,
        currency: account.external_accounts?.data?.[0]?.currency,
        country: account.external_accounts?.data?.[0]?.country,
      },
      taxIdProvided: account.tos_acceptance?.tax_id_provided,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingComplete: (account.charges_enabled && account.payouts_enabled) || false,
    }

    // Extract Address
    const address =
      account.business_type === 'company' ? account.company?.address : account.individual?.address
    if (address) {
      if (address.line1) UpdateData.street = address.line1
      if (address.line2) UpdateData.houseNumber = address.line2
      if (address.postal_code) UpdateData.zipCode = address.postal_code
      if (address.city) UpdateData.city = address.city
      if (address.country) UpdateData.country = address.country
    }

    let personData = {
      personId: '',
      firstName: '',
      lastName: '',
    }

    if (UpdateData.businessType === 'individual' && account.individual?.id) {
      const person = await stripe.accounts.retrievePerson(account.id, account.individual.id)
      console.log(`Retrieved person data:`, person)
      personData = {
        personId: person.id,
        firstName: person.first_name || '',
        lastName: person.last_name || '',
      }
      UpdateData.legalName = (person.first_name || '') + ' ' + (person.last_name || '')
    }

    try {
      // 1. Update Company
      const result = await req.payload.update({
        req,
        collection: CompaniesSlug,
        overrideAccess: true,
        where: {
          stripeAccountId: {
            equals: account.id,
          },
        },
        data: {
          ...UpdateData,
          person: personData,
        },
      })
      console.log(`Updated company with Stripe changes. Docs: ${result.docs?.length || 0}`)

      // 2. Sync to User (redundant but safe)
      await req.payload.update({
        req,
        collection: UsersSlug,
        overrideAccess: true,
        where: {
          connectedAccountId: {
            equals: account.id,
          },
        },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: (account.charges_enabled && account.payouts_enabled) || false,
        },
      })
    } catch (error) {
      console.error(`Failed to process Stripe account update:`, error)
      throw error
    }
}
