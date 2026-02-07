import { header } from '../layouts/header'
import { footer } from '../layouts/footer'
import { colors } from '../styles/colors'

type EmailOptions = {
  headline?: string
  content: string
  previewText?: string
}

export const generateEmailHtml = ({ headline, content, previewText }: EmailOptions): string => {
  const previewHtml = previewText
    ? `
      <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
      </div>
      <div style="display: none; max-height: 0px; overflow: hidden;">
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headline || 'Gutscheineland'}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            background-color: ${colors.background};
            font-family: 'Nunito', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          a {
            color: ${colors.primary};
            text-decoration: none;
          }
          .button {
            display: inline-block;
            background-color: ${colors.buttonPrimary};
            color: ${colors.buttonPrimaryText};
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            text-align: center;
          }
          .button:hover {
            background-color: ${colors.buttonHover};
          }
        </style>
      </head>
      <body style="background-color: ${colors.background}; margin: 0; padding: 0;">
        ${previewHtml}
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${colors.background}; width: 100%; min-width: 100%;">
          <tr>
            <td align="center" style="padding: 24px 0;">
              
              <!-- Main Container -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: ${colors.surface}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                
                <!-- Header -->
                <tr>
                  <td>
                    ${header()}
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 24px;">
                    ${headline ? `<h2 style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 24px; font-weight: 700;">${headline}</h2>` : ''}
                    <div style="color: ${colors.text}; font-size: 16px; line-height: 1.5;">
                      ${content}
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td>
                    ${footer()}
                  </td>
                </tr>

              </table>
            
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
