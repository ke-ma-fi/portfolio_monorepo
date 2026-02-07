import { generateEmailHtml } from '../utils/generateEmailHtml'
import { colors } from '../styles/colors'
import { escapeHtml, sanitizeEmailMessage, sanitizeAttribute, sanitizeUrl } from '@/utilities/sanitize'

type GiftNotificationProps = {
  recipientName: string
  buyerName?: string // Optional, if we have it
  companyName: string
  message?: string
  value: string // current balance
  originalValue: string // starting value
  expiryDate: string
  logoUrl?: string // Optional company logo URL
  viewLink: string
}

export const giftNotificationEmail = ({
  recipientName,
  buyerName,
  companyName,
  message,
  value,
  originalValue,
  expiryDate,
  logoUrl,
  viewLink,
}: GiftNotificationProps): string => {
  const greeting = `Hallo ${escapeHtml(recipientName)},`
  const buyerText = buyerName ? `von <strong>${escapeHtml(buyerName)}</strong>` : 'jemandem'

  const content = `
    <p style="margin-bottom: 24px; font-size: 18px;">${greeting}</p>
    <p style="margin-bottom: 24px;">
      Du hast einen Gutschein ${buyerText} geschenkt bekommen!
    </p>

    ${
      message
        ? `
      <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px; border-left: 4px solid ${colors.primary}; margin-bottom: 24px; font-style: italic;">
        "${sanitizeEmailMessage(message)}"
      </div>
    `
        : ''
    }
    
    <div style="border: 1px solid ${colors.border}; border-radius: 8px; padding: 24px; margin-bottom: 24px; background-color: ${colors.surface}; text-align: center;">
      ${
        logoUrl
          ? `<img src="${sanitizeUrl(logoUrl)}" alt="${sanitizeAttribute(companyName)}" style="max-width: 100px; max-height: 100px; margin-bottom: 16px; object-fit: contain;" />`
          : ''
      }
      <h3 style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 20px;">${escapeHtml(companyName)}</h3>
      <div style="font-size: 32px; font-weight: bold; color: ${colors.primary}; margin-bottom: 4px;">
        ${escapeHtml(value)}
      </div>
      <div style="font-size: 14px; color: ${colors.textSecondary}; margin-bottom: 16px;">
        Ursprünglicher Wert: ${escapeHtml(originalValue)}
      </div>
      <div style="font-size: 14px; color: ${colors.textSecondary}; margin-bottom: 24px;">
        Gültig bis: ${escapeHtml(expiryDate)}
      </div>
      
      <a href="${sanitizeUrl(viewLink)}" style="display: inline-block; background-color: ${colors.primary}; color: ${colors.surface}; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
        Geschenk abholen
      </a>
    </div>

    <p style="margin-top: 24px; font-size: 14px; color: ${colors.textSecondary}; text-align: center;">
      Viel Freude beim Einlösen!
    </p>
  `

  return generateEmailHtml({
    headline: 'Ein Geschenk für dich! 🎁',
    content,
    previewText: `Du hast einen Gutschein im Wert von ${escapeHtml(value)} erhalten!`,
  })
}
