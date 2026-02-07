import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Media } from '@/components/Media'
import { GiftCardOffer, Company } from '@/payload-types'
// Import from relative path to finding the component in the previous location is tricky, 
// but since I'm creating a new file I'll assume I need to fix the import path for CheckoutForm
// CheckoutForm is currently in `src/app/(frontend)/buy/[id]/CheckoutForm.tsx`
// I should probably move CheckoutForm to a shared location or import it from there.
// For now I will import it from the old location until I move it.
import { CheckoutForm } from '@/components/checkout/CheckoutForm' 
import { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { GiftCardOffersSlug } from '@/slugs'

type Args = {
  params: Promise<{
    slug: string
    id: string
  }>
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  
  try {
    const offer = await payload.findByID({
      collection: GiftCardOffersSlug,
      id,
    })

    return {
      title: offer ? `Checkout: ${offer.title} | Gutscheineland` : 'Checkout | Gutscheineland',
    }
  } catch (_error) {
    return {
      title: 'Checkout | Gutscheineland',
    }
  }
}

export default async function CheckoutPage({ params, searchParams }: Args) {
  const { slug, id } = await params
  const { activate } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const existingCardUuid = typeof activate === 'string' ? activate : undefined

  try {
    const offer = (await payload.findByID({
      collection: GiftCardOffersSlug,
      id,
      depth: 2,
    })) as GiftCardOffer

    if (!offer || !offer.isActive) {
      notFound()
    }

    const company = offer.company as Company
    const companySlug = company.slug
    // Ensure the offer actually belongs to the company in the URL
    if (slug !== companySlug) {
         notFound()
    }

    const companyName = company?.displayName || company?.legalName || 'Gutscheineland'
    const formattedPrice = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(offer.price)

    return (
      <div className="container max-w-4xl pt-32 pb-24 mx-auto px-4">
        <Link 
          href={`/shops/${slug}/offer/${id}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Zurück zum Angebot
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Order Summary / Product Info */}
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold">Kauf abschließen</h1>
            
            <div className="bg-muted/30 rounded-xl overflow-hidden border">
              <div className="relative aspect-[16/9] bg-muted">
                {offer.cardImage ? (
                  <Media resource={offer.cardImage} fill className="w-full h-full" imgClassName="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                    <span className="font-heading font-bold text-2xl uppercase opacity-10">{companyName}</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{companyName}</div>
                <h2 className="text-xl font-bold mb-2">{offer.title}</h2>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{offer.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span>Sofort per E-Mail verfügbar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-8">
            <CheckoutForm 
              offer={offer} 
              formattedPrice={formattedPrice} 
              existingCardUuid={existingCardUuid}
            />
          </div>
        </div>
      </div>
    )
  } catch (_error) {
    console.error(_error)
    notFound()
  }
}
