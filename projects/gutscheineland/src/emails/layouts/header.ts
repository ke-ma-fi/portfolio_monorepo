import { colors } from '../styles/colors'

export function header(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://gutscheineland.de'
  const logoUrl = `${baseUrl}/logo_nav_bright.png`

  return `
    <div style="background-color: ${colors.surface}; padding: 24px; text-align: center; border-bottom: 1px solid ${colors.border};">
      <a href="${baseUrl}" target="_blank" style="display: inline-block;">
        <img 
          src="${logoUrl}" 
          alt="Gutscheineland" 
          width="180" 
          style="display: block; width: 180px; max-width: 100%; height: auto; border: 0; font-family: sans-serif; font-size: 20px; color: ${colors.primary}; font-weight: bold;" 
        />
      </a>
    </div>
  `
}
