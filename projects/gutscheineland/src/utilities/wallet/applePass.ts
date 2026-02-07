import { PKPass } from 'passkit-generator'
import type { GiftCard, Company } from '@/payload-types'
import fs from 'fs'
import forge from 'node-forge'

export const generateApplePass = async (card: GiftCard, company: Company): Promise<Buffer> => {
  // 1. Validate Environment
  const certDetails = {
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
    p12Path: process.env.APPLE_P12_PATH,
    p12Base64: process.env.APPLE_P12_BASE64,
    passphrase: process.env.APPLE_PASSPHRASE,
    wwdrPath: process.env.APPLE_WWDR_CERT_PATH || './certs/wwdr.pem', // Default or env
    wwdrBase64: process.env.APPLE_WWDR_CERT_BASE64,
  }

  // Basic validation of required env vars
  const missing = []
  if (!certDetails.passTypeIdentifier) missing.push('APPLE_PASS_TYPE_IDENTIFIER')
  if (!certDetails.teamIdentifier) missing.push('APPLE_TEAM_IDENTIFIER')
  if (!certDetails.p12Path && !certDetails.p12Base64) missing.push('APPLE_P12_PATH or APPLE_P12_BASE64')
  if (!certDetails.passphrase) missing.push('APPLE_PASSPHRASE')

  if (missing.length > 0) {
    throw new Error(`Missing Apple Wallet configuration: ${missing.join(', ')}`)
  }

  // 2. Load Certificates
  const loadContent = (val?: string, pathVal?: string): Buffer | undefined => {
      if (val) return Buffer.from(val, 'base64')
      if (pathVal && fs.existsSync(pathVal)) return fs.readFileSync(pathVal)
      return undefined
  }

  const wwdrBuffer = loadContent(certDetails.wwdrBase64, certDetails.wwdrPath)
  if (!wwdrBuffer) {
      // In production we should throw, but maybe dev doesn't have it yet.
      throw new Error('Missing Apple WWDR Certificate (APPLE_WWDR_CERT_PATH)')
  }

  // 3. Process P12
  let signerCertPem = ''
  let signerKeyPem = ''
  
  try {
      const p12Buffer = loadContent(certDetails.p12Base64, certDetails.p12Path)
      if (!p12Buffer) throw new Error('Could not load P12 file')
      
      const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'))
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certDetails.passphrase)

      // Get Key
      // "localKeyId" is a common bag attribute, but often we just grab the first key.
      const pkcs8ShroudedKeyBagOid = forge.pki.oids.pkcs8ShroudedKeyBag || '1.2.840.113549.1.12.10.1.2'
      const keyBags = p12.getBags({ bagType: pkcs8ShroudedKeyBagOid })
      const keyBag = keyBags[pkcs8ShroudedKeyBagOid]?.[0]
      
      if (!keyBag?.key) {
           // Try standard key bag just in case
           const keyBagOid = forge.pki.oids.keyBag || '1.2.840.113549.1.12.10.1.1'
           const keyBags2 = p12.getBags({ bagType: keyBagOid })
           const keyBag2 = keyBags2[keyBagOid]?.[0]
           if (!keyBag2?.key) throw new Error('No private key found in P12')
           signerKeyPem = forge.pki.privateKeyToPem(keyBag2.key)
      } else {
           signerKeyPem = forge.pki.privateKeyToPem(keyBag.key)
      }

      // Get Cert
      const certBagOid = forge.pki.oids.certBag || '1.2.840.113549.1.12.10.1.3'
      const certBags = p12.getBags({ bagType: certBagOid })
      const certBag = certBags[certBagOid]?.[0]
      
      if (!certBag?.cert) throw new Error('No certificate found in P12')
      
      
      signerCertPem = forge.pki.certificateToPem(certBag.cert)

  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to parse P12:', err)
      throw new Error(`Failed to decrypt/parse P12 file: ${err.message}`)
  }

  
  
  const organizationName = (typeof company === 'object' ? company.displayName || company.legalName : 'Gutscheineland') || 'Gutscheineland'
  
  // 4. Construct Full Pass JSON
  // We construct the complete pass.json manually to ensure type and fields are correctly parsed by the library.
  // This avoids issues with the constructor props or direct property assignment.
  // Branding Colors
  const primaryColor = company?.primaryColor || '#ffffff' // Background
  const secondaryColor = company?.secondaryColor || '#000000' // Label Color
  const textColor = company?.primaryColor ? '#ffffff' : '#000000' // Hardcoded white text if custom back, else black

  // Function to convert hex to rgb string for Apple Wallet
  // Format: rgb(r, g, b)
  const hexToRgb = (hex: string): string | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null
      return `rgb(${parseInt(result[1] as string, 16)}, ${parseInt(result[2] as string, 16)}, ${parseInt(result[3] as string, 16)})`
  }
  
  const backgroundColor = hexToRgb(primaryColor) || 'rgb(255, 255, 255)'
  const labelColor = hexToRgb(secondaryColor) || 'rgb(80, 80, 80)'
  const foregroundColor = hexToRgb(textColor) || 'rgb(0, 0, 0)'

  const passJson = {
      formatVersion: 1,
      passTypeIdentifier: certDetails.passTypeIdentifier!,
      teamIdentifier: certDetails.teamIdentifier!,
      serialNumber: card.uuid, // Mandatory for updates and uniqueness
      organizationName: organizationName,
      description: `Gutschein von ${organizationName}`,
      logoText: organizationName,
      foregroundColor: foregroundColor,
      backgroundColor: backgroundColor,
      labelColor: labelColor,
      storeCard: {
          primaryFields: [
              {
                  key: 'balance',
                  label: 'Guthaben',
                  value: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(card.remainingBalance || 0),
              }
          ],
          secondaryFields: [
              {
                  key: 'expires',
                  label: 'Gültig bis',
                  value: card.expiryDate ? new Date(card.expiryDate).toLocaleDateString('de-DE') : 'Unbegrenzt'
              }
          ],
          auxiliaryFields: [
              {
                  key: 'code',
                  label: 'Gutschein-Code',
                  value: card.code || ''
              }
          ]
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://gutscheineland.de'}/view/${card.recipientUuid || card.uuid}`,
          messageEncoding: 'iso-8859-1'
        }
      ]
  }

  // 5. Load Images
  const { loadAsset } = await import('@/utilities/loadAsset')

  // Load defaults first
  const defaultIcon = (await loadAsset('/apple-wallet-icon.png')) || (await loadAsset('/logo_nav_dark.png'))
  const defaultLogo = (await loadAsset('/apple-wallet-logo.png')) || (await loadAsset('/logo_nav_dark.png'))
  
  // Try Company Assets
  let logoBuffer: Buffer | undefined = defaultLogo
  let iconBuffer: Buffer | undefined = defaultIcon
  let stripBuffer: Buffer | undefined = undefined

  if (company.logo) {
      // Opt for 'square' size (500x500) if available, otherwise fallback to main
      // We cast to 'any' because strict typing of 'sizes' might be tricky depending on Payload type generation
      const logoMedia = company.logo as any
      const logoUrl = logoMedia.sizes?.square?.url || logoMedia.url
      
      const b = await loadAsset(logoUrl)
      if (b) {
          logoBuffer = b
          iconBuffer = b // Use logo as icon too if available
      }
  }

  if (company.headerImage) {
      // Opt for 'medium' (900px width) or 'large' (1400px) for the strip
      // Apple Strip is 375pt wide -> ~1125px @3x. 'large' (1400) is safest, 'medium' (900) might be slightly soft on Max phones.
      const headerMedia = company.headerImage as any
      const headerUrl = headerMedia.sizes?.large?.url || headerMedia.sizes?.medium?.url || headerMedia.url

      const b = await loadAsset(headerUrl)
      if (b) {
          stripBuffer = b
      }
  }

  const images: { [key: string]: Buffer } = {}
  if (iconBuffer) images['icon.png'] = iconBuffer
  if (iconBuffer) images['icon@2x.png'] = iconBuffer // Apple likes 2x, reusing buffer is fine
  if (logoBuffer) images['logo.png'] = logoBuffer
  if (logoBuffer) images['logo@2x.png'] = logoBuffer
  
  if (stripBuffer) {
      images['strip.png'] = stripBuffer
      images['strip@2x.png'] = stripBuffer
  }

  try {
      const pass = new PKPass(
          images, 
          {
            wwdr: wwdrBuffer,
            signerCert: signerCertPem,
            signerKey: signerKeyPem,
          },
          {} // Empty props, we load everything via pass.json
      )

      // Inject the pass.json as a buffer. 
      // The library's addBuffer method detects "pass.json", parses it, sets the specific Pass Type (storeCard),
      // and populates all fields automatically.
      pass.addBuffer('pass.json', Buffer.from(JSON.stringify(passJson)))



      return await pass.getAsBuffer()

  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.warn('Pass generation failed internal:', err)
      throw new Error('Apple Wallet Pass generation failed: ' + err.message)
  }
}

