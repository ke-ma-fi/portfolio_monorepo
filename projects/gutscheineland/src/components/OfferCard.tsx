'use client'

import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { GiftCardOffer, Company } from '@/payload-types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * OfferCard Component
 * 
 * Displays a single Gift Card Offer in a grid layout.
 * Shows the company branding, offer price/value, and provides a link to purchase.
 */
export const OfferCard: React.FC<{ offer: GiftCardOffer }> = ({ offer }) => {
  const company = offer.company as Company
  const companyName =
    (company && typeof company === 'object' && (company.displayName || company.legalName)) ||
    'Gutscheineland'
    

  const companySlug = company?.slug || 'unknown'
  const price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    offer.price,
  )
  const value = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    offer.value,
  )

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-md border-2 hover:border-primary/50">
      <div className="relative aspect-[16/9] w-full bg-muted">
        {offer.cardImage ? (
          <Media resource={offer.cardImage} fill className="w-full h-full" imgClassName="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
            <span className="font-heading font-bold text-lg uppercase opacity-20">{companyName}</span>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">{companyName}</div>
        <CardTitle className="line-clamp-1">{offer.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {offer.description || 'Keine Beschreibung verfügbar.'}
        </p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Wert</p>
            <p className="font-bold">{value}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">Preis</p>
            <p className="text-xl font-extrabold text-primary">{price}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/shops/${companySlug}/offer/${offer.id}`}>Auswählen</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
