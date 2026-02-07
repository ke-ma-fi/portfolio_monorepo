import { generateEmailHtml } from '../utils/generateEmailHtml'
import { colors } from '../styles/colors'
import { escapeHtml, sanitizeAttribute, sanitizeUrl } from '@/utilities/sanitize'

export type GiftCardSummary = {
  companyName: string
  statusLabel: string
  remainingBalance: string // formatted currency
  originalValue: string // formatted currency
  expiryDate: string
  logoUrl?: string // Optional company logo URL
  viewLink: string
}

export type ReceiptDetails = {
  totalAmount: string
  date: string
  transactionId: string
  vatNote?: string
}

type ResendCardsProps = {
  firstName?: string
  boughtCards: GiftCardSummary[]
  receivedCards: GiftCardSummary[]
  receiptDetails?: ReceiptDetails
}

const renderCardList = (cards: GiftCardSummary[]) => {
  return cards
    .map(
      (card) => `
    <div style="border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: ${colors.surface};">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
         ${
           card.logoUrl
             ? `<img src="${sanitizeUrl(card.logoUrl)}" alt="${sanitizeAttribute(card.companyName)}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; margin-right: 12px;" />`
             : ''
         }
         <h3 style="margin: 0; color: ${colors.text}; font-size: 18px; line-height: 1.2;">${escapeHtml(card.companyName)}</h3>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: ${colors.textSecondary}; font-size: 14px;">Guthaben:</span>
        <span style="color: ${colors.success}; font-weight: bold; font-size: 16px;">${escapeHtml(card.remainingBalance)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed ${colors.border}; padding-bottom: 8px;">
        <span style="color: ${colors.textSecondary}; font-size: 12px;">Ursprünglicher Wert:</span>
        <span style="color: ${colors.text}; font-size: 12px;">${escapeHtml(card.originalValue)}</span>
      </div>
      <div style="font-size: 14px; color: ${colors.textSecondary}; margin-bottom: 16px;">
        Status: <span style="background-color: ${colors.background}; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">${escapeHtml(card.statusLabel)}</span>
        <br>
        Gültig bis: ${escapeHtml(card.expiryDate)}
      </div>
      <div style="text-align: center;">
        <a href="${sanitizeUrl(card.viewLink)}" style="display: inline-block; background-color: ${colors.primary}; color: ${colors.surface}; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
          Gutschein anzeigen
        </a>
      </div>
    </div>
  `,
    )
    .join('')
}

export const resendCardsEmail = ({
  firstName,
  boughtCards = [],
  receivedCards = [],
  receiptDetails,
}: ResendCardsProps): string => {
  const greeting = firstName ? `Hallo ${escapeHtml(firstName)},` : 'Hallo,'

  let content = `<p style="margin-bottom: 24px;">${greeting}</p>
    <p style="margin-bottom: 24px;">
      Hier ist die Übersicht deiner aktuellen Gutscheine bei Gutscheineland.
    </p>`

  if (boughtCards.length > 0) {
    content += `
      <h2 style="color: ${colors.text}; font-size: 20px; margin-bottom: 16px; margin-top: 32px;">Gekaufte Gutscheine</h2>
      <p style="margin-bottom: 16px; color: ${colors.textSecondary};">Diese Gutscheine hast du gekauft. Über den Link kannst du sie verwalten oder verschenken.</p>
      <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px;">
        ${renderCardList(boughtCards)}
      </div>
    `
  }

  if (receivedCards.length > 0) {
    content += `
      <h2 style="color: ${colors.text}; font-size: 20px; margin-bottom: 16px; margin-top: 32px;">Erhaltene Gutscheine</h2>
      <p style="margin-bottom: 16px; color: ${colors.textSecondary};">Diese Gutscheine wurden dir geschenkt. Du kannst sie direkt einlösen.</p>
      <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px;">
        ${renderCardList(receivedCards)}
      </div>
    `
  }

  if (receiptDetails) {
    content += `
      <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 32px 0;">
      <h3 style="color: ${colors.text}; margin-bottom: 16px;">Zahlungsbeleg / Quittung</h3>
      <table style="width: 100%; font-size: 14px; color: ${colors.text};">
        <tr>
          <td style="padding-bottom: 8px; color: ${colors.textSecondary};">Datum:</td>
          <td style="padding-bottom: 8px; text-align: right;">${escapeHtml(receiptDetails.date)}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: ${colors.textSecondary};">Transaktions-ID:</td>
          <td style="padding-bottom: 8px; text-align: right; font-family: monospace;">${escapeHtml(receiptDetails.transactionId)}</td>
        </tr>
        <tr>
          <td style="padding-top: 8px; font-weight: bold; border-top: 1px dashed ${colors.border};">Gesamtbetrag:</td>
          <td style="padding-top: 8px; font-weight: bold; border-top: 1px dashed ${colors.border}; text-align: right;">${escapeHtml(receiptDetails.totalAmount)}</td>
        </tr>
      </table>
      ${
        receiptDetails.vatNote
          ? `<p style="margin-top: 16px; font-size: 12px; color: ${colors.textSecondary};">${escapeHtml(receiptDetails.vatNote)}</p>`
          : ''
      }
    `
  }

  content += `
    <p style="margin-top: 24px;">
      <small style="color: ${colors.textSecondary};">
        Tipp: Speichere dir diese E-Mail oder die Links, um später schnell auf deine Gutscheine zugreifen zu können.
      </small>
    </p>
  `

  return generateEmailHtml({
    headline: 'Deine Gutscheine',
    content,
    previewText: `Hier ist dein Zugriff auf deine Gutscheine.`,
  })
}
