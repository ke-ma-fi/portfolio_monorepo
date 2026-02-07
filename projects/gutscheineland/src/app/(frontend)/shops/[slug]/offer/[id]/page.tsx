import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Metadata } from 'next'
import { GiftCardOffer, Company } from '@/payload-types'
import Link from 'next/link'
import { ChevronLeft, Building2, Globe, Phone, Mail, Info } from 'lucide-react'

import { PrintInactiveCardButton } from '@/components/PrintInactiveCardButton'
import { GiftCardOffersSlug } from '@/slugs'

type Args = {
  params: Promise<{
    slug: string
    id: string
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
      title: offer ? `${offer.title} | Gutscheineland` : 'Gutschein | Gutscheineland',
    }
  } catch (_error) {
    return {
      title: 'Gutschein | Gutscheineland',
    }
  }
}

export default async function OfferDetailPage({ params }: Args) {
  const { slug, id } = await params
  const payload = await getPayload({ config: configPromise })

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
    const price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(offer.price)
    const value = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(offer.value)

    return (
      <div className="container pt-32 pb-24 mx-auto px-4">
        <Link 
          href={`/shops/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Zurück zum Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Image and Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted border shadow-sm">
              {offer.cardImage ? (
                <Media resource={offer.cardImage} fill className="w-full h-full" imgClassName="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                  <span className="font-heading font-bold text-4xl uppercase opacity-10">{companyName}</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-bold text-primary uppercase tracking-widest mb-2">{companyName}</div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">{offer.title}</h1>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {offer.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Sidebar */}
          <div className="lg:col-span-5">
            <Card className="border-2 border-primary shadow-xl overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground border-b px-6 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80 text-white">Ihr Angebot</span>
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                    Sofort-Lieferung
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-8 px-6 pb-8 space-y-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground font-medium">Gutscheinwert</span>
                  <span className="text-2xl font-bold">{value}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground font-medium">Kaufpreis</span>
                  <span className="text-4xl font-extrabold text-primary">{price}</span>
                </div>

                <hr className="border-border border-dashed" />

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-green-100 text-green-700 p-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 14.142l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L9 15.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </div>
                    <p className="font-medium text-slate-700">Digitaler Versand per E-Mail</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                     <div className="mt-1 bg-blue-100 text-blue-700 p-1 rounded-full">
                         <Info className="w-3 h-3" />
                     </div>
                    <p className="font-medium text-slate-700">Gültigkeit: {offer.expiryDurationDays} Tage</p>
                  </div>
                </div>

                <Button className="w-full h-14 text-lg font-extrabold shadow-lg shadow-primary/20 mt-4 uppercase tracking-tight" asChild>
                  <Link href={`/shops/${slug}/buy/${offer.id}`}>Jetzt kaufen</Link>
                </Button>
                
                <div className="flex items-center justify-center gap-2 pt-2 grayscale opacity-50 contrast-125">
                   {/* Placeholder for payment provider logos */}
                   <span className="text-[10px] font-bold border border-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-tighter text-muted-foreground">Stripe</span>
                   <span className="text-[10px] font-bold border border-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-tighter text-muted-foreground">Visa</span>
                   <span className="text-[10px] font-bold border border-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-tighter text-muted-foreground">MasterCard</span>
                </div>
              </CardContent>
            </Card>

            {/* Print Inactive Card Button */}
            <PrintInactiveCardButton offerId={offer.id.toString()} />

            {/* Company Info Box */}
            <div className="mt-8 p-6 bg-muted/30 rounded-xl border space-y-4">
              <h3 className="font-bold text-lg">Herausgeber</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-medium">{company?.legalName || companyName}</span>
                </div>
                {company?.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-muted-foreground transition-colors">
                      {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                )}
                {company?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <a href={`tel:${company.phone}`} className="hover:underline text-muted-foreground transition-colors">
                      {company.phone}
                    </a>
                  </div>
                )}
                {company?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <a href={`mailto:${company.email}`} className="hover:underline text-muted-foreground transition-colors">
                      {company.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (_error) {
    console.error(_error)
    notFound()
  }
}
