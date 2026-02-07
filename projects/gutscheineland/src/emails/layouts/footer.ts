import { colors } from '../styles/colors'

export function footer(): string {
  const currentYear = new Date().getFullYear()
  
  return `
    <div style="background-color: ${colors.background}; padding: 24px; text-align: center; font-family: 'Nunito', Arial, sans-serif; font-size: 14px; color: ${colors.textSecondary};">
      <p style="margin: 0 0 12px 0;">
        &copy; ${currentYear} Gutscheineland. Alle Rechte vorbehalten.
      </p>
      <p style="margin: 0;">
        Dies ist eine automatische Nachricht. Bitte antworten Sie nicht direkt auf diese E-Mail.
      </p>
      <p style="margin: 12px 0 0 0;">
        <a href="https://gutscheineland.de/impressum" style="color: ${colors.primary}; text-decoration: none;">Impressum</a>
        &nbsp;|&nbsp;
        <a href="https://gutscheineland.de/datenschutz" style="color: ${colors.primary}; text-decoration: none;">Datenschutz</a>
      </p>
    </div>
  `
}
