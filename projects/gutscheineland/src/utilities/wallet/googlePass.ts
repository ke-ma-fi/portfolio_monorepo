import jwt from 'jsonwebtoken'
import type { GiftCard, Company } from '@/payload-types'

export const generateGooglePassLink = async (card: GiftCard, company: Company): Promise<{ url: string }> => {
  // 1. Validate Environment
  const credentials = {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  }

  const missing = []
  if (!credentials.issuerId) missing.push('GOOGLE_WALLET_ISSUER_ID')
  if (!credentials.clientEmail) missing.push('GOOGLE_CLIENT_EMAIL')
  if (!credentials.privateKey) missing.push('GOOGLE_PRIVATE_KEY')

  if (missing.length > 0) {
    throw new Error(`Missing Google Wallet credentials: ${missing.join(', ')}`)
  }
  
  // Clean Private Key
  let cleanKey = credentials.privateKey || ''

  // 1. Try to parse as JSON (in case user pasted the entire service-account.json content)
  try {
     if (cleanKey.trim().startsWith('{')) {
        const jsonKey = JSON.parse(cleanKey)
        if (jsonKey.private_key) {
            cleanKey = jsonKey.private_key
        }
     }
  } catch (e) {
    // Not JSON, continue
  }

  // 2. Fix escaped newlines
  cleanKey = cleanKey.replace(/\\n/g, '\n')

  // 3. Validation: Check if it's suspiciously short (e.g. user pasted the 40-char Key ID)
  // A 2048-bit RSA Private Key in PEM format is usually > 1500 chars.
  // A Key ID is exactly 40 chars.
  if (cleanKey.replace(/\s/g, '').length < 100) {
      throw new Error(`Google Private Key is too short (${cleanKey.length} chars). You likely pasted the 'private_key_id' (40 chars) instead of the 'private_key' block. Please copy the HUGE text block starting with "-----BEGIN PRIVATE KEY-----" from your JSON file.`)
  }

  // 4. Check for headers and fix if missing
  if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
     const cleanBody = cleanKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
     cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanBody}\n-----END PRIVATE KEY-----`
  }

  credentials.privateKey = cleanKey


  // 2. Define Pass Data
  // Construct the "GiftCardObject" payload
  
  const companyName = (typeof company === 'object' ? company.displayName || company.legalName : 'Gutscheineland') || 'Gutscheineland'
  const issuerId = credentials.issuerId
  const classId = `${issuerId}.company_${typeof company === 'object' ? company.slug || company.id : 'default'}_v1` // Unique class per company
  const objectId = `${issuerId}.${card.uuid}`
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://gutscheineland.de'
  
  // Logic to handle localhost:
  // 1. Google Wallet needs HTTPS for images and links.
  // 2. Google servers cannot reach localhost for images.
  const isLocalhost = serverUrl.includes('localhost') || serverUrl.includes('192.168.') || serverUrl.includes('127.0.0.1') || serverUrl.startsWith('http://')

  let safeLinkUrl = `${serverUrl}/view/${card.uuid}`
  if (isLocalhost) {
       // Deep links to localhost don't work well
      safeLinkUrl = 'https://gutscheineland.de' 
  }

  // Helper to resolve asset URL
  const resolveAssetUrl = (media: any, fallbackUrl: string) => {
       if (!media) return fallbackUrl
       
       let url = ''
       if (typeof media === 'string') url = media
       else if (media.url) url = media.url
       
       if (!url) return fallbackUrl

       // If fully qualified, check localhost
       if (url.startsWith('http')) {
           if (isLocalhost && (url.includes('localhost') || url.includes('127.0.0.1'))) {
               // Cannot use local asset
               return fallbackUrl
           }
           return url
       }

       // Relative path
       if (isLocalhost) {
           return fallbackUrl
       }
       
       return `${serverUrl}${url}`
  }

  // Optimize Images: Use Square (500px) for Logo, Large (1400px) for Hero
  const logoMedia = company.logo as any
  const logoUrl = logoMedia?.sizes?.square?.url || logoMedia?.url
  const safeLogoUrl = resolveAssetUrl(logoUrl, isLocalhost ? 'https://placehold.co/400x400/png?text=Logo' : `${serverUrl}/logo_nav_bright.png`)

  const headerMedia = company.headerImage as any
  const headerUrl = headerMedia?.sizes?.large?.url || headerMedia?.sizes?.medium?.url || headerMedia?.url
  const safeHeroUrl = resolveAssetUrl(headerUrl, isLocalhost ? 'https://placehold.co/1032x336/png?text=Header' : '') // No default hero if missing

  // Define the generic Gift Card Class (embedded or referenced)
  // For the "Signed JWT" method, we can include the class definition in the JWT to upsert it.
  
  const giftCardClass: any = {
    id: classId,
    reviewStatus: 'UNDER_REVIEW', // or APPROVED (requires Google Review)
    issuerName: 'Gutscheineland', // Platform name
    programName: `${companyName} Gutschein`,
    hexBackgroundColor: company.primaryColor || '#ffffff', // Set dynamic background color
    programLogo: {
        sourceUri: {
            uri: safeLogoUrl
        },
        contentDescription: {
            defaultValue: {
                language: 'de-DE',
                value: `${companyName} Logo`
            }
        }
    },
    textModulesData: [
       {
           header: 'Info',
           body: 'Einlösbar bei teilnehmenden Partnern.'
       }
    ]
  }

  if (safeHeroUrl && safeHeroUrl !== '') {
      giftCardClass.heroImage = {
          sourceUri: {
              uri: safeHeroUrl
          },
          contentDescription: {
              defaultValue: {
                  language: 'de-DE',
                  value: 'Header Bild'
              }
          }
      }
  }

  const giftCardObject = {
    id: objectId,
    classId: classId,
    state: card.status === 'active' ? 'ACTIVE' : 'INACTIVE',
    cardNumber: card.code, // REQUIRED by Google Wallet for Gift Cards
    barcode: {
        type: 'QR_CODE',
        value: `${serverUrl}/view/${card.recipientUuid || card.uuid}`, // Standard View Link (Login via UUID)
        alternateText: card.code
    },
    textModulesData: [
        {
            header: 'Guthaben',
            body: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(card.remainingBalance || 0)
        },
        {
            header: 'Ausgestellt von',
            body: companyName
        },
        {
            header: 'Gültig bis',
            body: card.expiryDate ? new Date(card.expiryDate).toLocaleDateString('de-DE') : 'Unbegrenzt'
        }
    ],
    linksModuleData: {
        uris: [
            {
                uri: safeLinkUrl,
                description: 'Karte online ansehen'
            }
        ]
    }
  }

  // 3. Create JSON Web Token
  // The claims structure for Google Wallet
  const claims = {
    iss: credentials.clientEmail,
    aud: 'google',
    origins: [],
    typ: 'savetowallet',
    payload: {
        // We can bundle both class and object to ensure the class exists (Upsert)
        giftCardClasses: [giftCardClass],
        giftCardObjects: [giftCardObject]
    }
  }

  const token = jwt.sign(claims, credentials.privateKey!, { algorithm: 'RS256' })

  return {
    url: `https://pay.google.com/gp/v/save/${token}`
  }
}
