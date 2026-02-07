import { Payload } from 'payload'
import { Company, GiftCard } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { formatCurrency, formatDate } from '@/utilities/format'
import { resendCardsEmail } from '@/emails/templates/resendCards'
import { giftNotificationEmail } from '@/emails/templates/giftNotification'
import { CompaniesSlug } from '@/slugs'

interface SendGiftCardEmailOptions {
  payload: Payload
  email: string
  type: 'receipt' | 'gift_notification' | 'recovery'
  cards: GiftCard[]
  context?: {
    buyerName?: string
    receiptDetails?: any
  }
}

/**
 * Orchestrates sending emails with correct company branding and formatting.
 */
export async function sendGiftCardEmail({
  payload,
  email,
  type,
  cards,
  context,
}: SendGiftCardEmailOptions) {
  const baseURL = getServerSideURL()

  // Helper to resolve company details for a card
  const resolveCardDetails = async (card: GiftCard, isRecipientView: boolean) => {
    let company = card.company as Company
    
    // Resolve Company if ID only
    if (typeof card.company !== 'object' && card.company) {
       const companyRes = await payload.findByID({
          collection: CompaniesSlug,
          id: card.company as number,
       })
       company = companyRes as Company
    }

    const companyName = company?.displayName || company?.legalName || 'Unbekanntes Unternehmen'
    let logoUrl = undefined

    if (company?.logo) {
      const logoMedia = company.logo as any
      const rawUrl = logoMedia.sizes?.square?.url || logoMedia.sizes?.thumbnail?.url || logoMedia.url
      if (rawUrl) {
         try {
            const { getMediaUrl } = await import('@/utilities/getMediaUrl')
            logoUrl = getMediaUrl(rawUrl)
         } catch (e) {
            console.warn('Failed to resolve logo URL', e)
         }
      }
    }

    // Status Label Logic
    let statusLabel = 'Aktiv'
    if (card.status === 'redeemed') statusLabel = 'Eingelöst'
    else if (card.status === 'inactive') statusLabel = 'Inaktiv'
    else if (card.giftedAt && !isRecipientView) statusLabel = 'Verschenkt'
    
    // Recovery specific: If recipient viewing, label is 'Erhalten'
    if (type === 'recovery' && isRecipientView) statusLabel = 'Erhalten'
    
    // Kiosk specific: 


    // View Link: Buyer vs Recipient
    const uuidToUse = isRecipientView ? (card.recipientUuid || card.uuid) : card.uuid
    const viewLink = `${baseURL}/view/${uuidToUse}`

    return {
      companyName,
      logoUrl,
      statusLabel,
      remainingBalance: formatCurrency(card.remainingBalance || 0),
      originalValue: formatCurrency(card.originalValue || 0),
      expiryDate: formatDate(card.expiryDate),
      viewLink,
    }
  }

  // --- Logic Branching based on Type ---

  if (type === 'gift_notification') {
    // Single card usually for gift notifs
    const card = cards[0]
    if (!card) {
      console.warn('No card provided for gift notification')
      return
    }
    const details = await resolveCardDetails(card, true) // isRecipientView = true

    const html = giftNotificationEmail({
      recipientName: card.recipientName || 'Empfänger',
      buyerName: context?.buyerName,
      companyName: details.companyName,
      message: card.message || undefined,
      value: details.remainingBalance,
      originalValue: details.originalValue,
      expiryDate: details.expiryDate,
      logoUrl: details.logoUrl || '', // Template might expect string
      viewLink: details.viewLink,
    })

    await payload.sendEmail({
      to: email,
      subject: `Du hast ein Geschenk erhalten! 🎁`,
      html,
    })

  } else if (type === 'receipt' || type === 'recovery') {
    // Split cards into Bought vs Received (only relevant for recovery usually, but receipt might be mixed in future?)
    // For receipt of "Self Purchase", it's 'bought'.
    // For receipt of "Gift Purchase", it's 'bought' (show as Verschenkt).
    
    const boughtCardsRaw = cards.filter(c => c.customerEmail === email)
    const receivedCardsRaw = cards.filter(c => c.recipientEmail === email)

    const boughtCards = await Promise.all(boughtCardsRaw.map(c => resolveCardDetails(c, false)))
    const receivedCards = await Promise.all(receivedCardsRaw.map(c => resolveCardDetails(c, true)))

    const html = resendCardsEmail({
      firstName: context?.buyerName,
      boughtCards,
      receivedCards,
      receiptDetails: context?.receiptDetails,
    })

    const subject = type === 'receipt' 
      ? 'Deine Bestellung bei Gutscheineland' 
      : 'Zugriff auf deine Gutscheine'

    await payload.sendEmail({
      to: email,
      subject,
      html,
    })
  }

  console.log(`[Notification] Sent ${type} email to ${email}`)
}
