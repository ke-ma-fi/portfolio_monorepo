import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import PrintLayout from './PrintLayout'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import { Company, GiftCard, GiftCardOffer } from '@/payload-types'
import { GiftCardsSlug } from '@/slugs'

type Args = {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  await params
  return {
    title: 'Gutschein drucken | Gutscheineland',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    referrer: 'no-referrer',
  }
}

export default async function PrintCardPage({ params }: Args) {
  const { uuid } = await params
  const payload = await getPayload({ config: configPromise })

  const { docs: cards } = await payload.find({
    collection: GiftCardsSlug,
    where: {
      uuid: {
        equals: uuid,
      },
    },
    depth: 2, // Need depth to get Offer details properly
  })

  if (!cards || cards.length === 0) {
    notFound()
  }

  const card = cards[0] as GiftCard
  if (!card) {
    notFound()
  }
  const offer = card.offer as GiftCardOffer
  const company = card.company as Company // Should be populated via hook or query

  // Fallback for company name if not populated directly on card (it usually is via hook)
  const companyName = company?.displayName || company?.legalName || 'Gutscheineland'

  // Generate QR URL (Using recipientUuid or uuid)
  // For physical cards, we want the "Smart View" which is handled by ViewCardPage
  // So we point to /view/[uuid] (or recipientUuid if available)
  const qrTargetUuid = card.recipientUuid || card.uuid
  const qrUrl = `${getServerSideURL()}/view/${qrTargetUuid}`

  const serializableCard = JSON.parse(JSON.stringify(card))
  const serializableOffer = JSON.parse(JSON.stringify(offer))

  return (
    <PrintLayout 
      card={serializableCard} 
      offer={serializableOffer} 
      companyName={companyName}
      qrUrl={qrUrl}
    />
  )
}
