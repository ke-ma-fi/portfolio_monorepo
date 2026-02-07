import { PayloadRequest } from 'payload'
import { getServicePayload } from '@/services/baseService'
import { CompaniesSlug, GiftCardsSlug } from '@/slugs'
import { Company, GiftCard } from '@/payload-types'
import { generateGooglePassLink } from '@/utilities/wallet/googlePass'
import { generateApplePass } from '@/utilities/wallet/applePass'

interface CreateGoogleWalletLinkOptions {
  uuid: string
  req?: PayloadRequest
}

export async function createGoogleWalletLink({ uuid, req }: CreateGoogleWalletLinkOptions) {
  const payload = await getServicePayload({ req })

  const { docs: cards } = await payload.find({
    req,
    collection: GiftCardsSlug,
    where: { uuid: { equals: uuid } },
    depth: 1,
  })

  if (cards.length === 0) {
    throw new Error('Card not found')
  }

  const card = cards[0] as GiftCard

  let company: Company
  if (typeof card.company === 'object') {
     company = card.company as Company
  } else if (card.company) {
     const companyRes = await payload.findByID({
         req,
         collection: CompaniesSlug,
         id: card.company as number
     })
     company = companyRes as Company
  } else {
     company = { legalName: 'Gutscheineland' } as Company
  }

  const { url } = await generateGooglePassLink(card, company)

  return { url }
}

interface GenerateApplePassOptions {
  req: PayloadRequest
  uuid: string
}

export async function generateAppleWalletPass({ req, uuid }: GenerateApplePassOptions) {
    const payload = await getServicePayload({ req })

    const result = await payload.find({
        req,
        collection: GiftCardsSlug,
        where: { uuid: { equals: uuid } },
        limit: 1,
        depth: 2,
    })

    if (result.docs.length === 0) throw new Error('Card not found')
    const card = result.docs[0] as GiftCard

    let company: Company
    if (typeof card.company === 'object') {
        company = card.company as Company
    } else if (card.company) {
            const companyRes = await payload.findByID({
                req,
                collection: CompaniesSlug,
                id: card.company as number,
                depth: 2
            })
            company = companyRes as Company
    } else {
            company = { legalName: 'Gutscheineland' } as Company
    }
    
    return generateApplePass(card, company)
}
