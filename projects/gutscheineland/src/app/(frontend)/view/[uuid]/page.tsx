import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import CardDisplay from './CardDisplay'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import { GiftCard } from '@/payload-types'
import { GiftCardsSlug } from '@/slugs'

type Args = {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { uuid } = await params
  return {
    title: 'Gutschein ansehen | Gutscheineland',
    description: `Gutschein ${uuid}`,
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

export default async function ViewCardPage({ params }: Args) {
  const { uuid } = await params
  const payload = await getPayload({ config: configPromise })

  const { docs: cards } = await payload.find({
    collection: GiftCardsSlug,
    where: {
      or: [
        {
          uuid: {
            equals: uuid,
          },
        },
        {
          recipientUuid: {
            equals: uuid,
          },
        },
      ],
    },
    depth: 2,
  })

  if (!cards || cards.length === 0) {
    notFound()
  }

  const card = cards[0] as GiftCard
  if (!card) {
    notFound()
  }
  const viewMode = card.uuid === uuid ? 'buyer' : 'recipient'

  // Generate QR URL
  // Always point to the recipient view for the QR code
  const qrTargetUuid = card.recipientUuid || card.uuid
  const qrUrl = `${getServerSideURL()}/view/${qrTargetUuid}`

  // Serialize for client component
  // We need to be careful with passing Payload docs to client components due to potentially non-serializable data (like functions, though rare in docs)
  // Converting to plain object helps.
  const serializableCard = JSON.parse(JSON.stringify(card))

  return (
    <div className="container max-w-md pt-32 pb-12 mx-auto px-4">
      <CardDisplay card={serializableCard} viewMode={viewMode} qrUrl={qrUrl} />
    </div>
  )
}

