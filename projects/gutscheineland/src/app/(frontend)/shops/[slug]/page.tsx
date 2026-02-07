import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { OfferCard } from '@/components/OfferCard'
import { Media } from '@/components/Media'
import { GiftCardOffer, Tag } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, Mail, Phone, Instagram, Facebook, Linkedin, Twitter, Youtube, Scale, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { CompaniesSlug, GiftCardOffersSlug } from '@/slugs'

export const dynamic = 'force-dynamic'

export default async function CompanyShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  // 1. Fetch Company
  const { docs: companies } = await payload.find({
    collection: CompaniesSlug,
    where: {
      slug: {
        equals: slug,
      },
      isActive: {
        equals: true,
      },
    },
    limit: 1,
  })

  const company = companies[0]

  if (!company) {
    notFound()
  }

  // 2. Fetch Offers for this Company
  const { docs: offers } = await payload.find({
    collection: GiftCardOffersSlug,
    where: {
      company: {
        equals: company.id,
      },
      isActive: {
        equals: true,
      },
    },
    depth: 1,
  })

  // Ensure data is serializable
  const sanitizedOffers = JSON.parse(JSON.stringify(offers))
  
  // Safely cast tags since they can be string IDs or objects
  const companyTags = (company.tags as Tag[] | undefined)?.filter(t => typeof t === 'object' && t !== null) || []


  return (
    <div className="pb-24">
      {/* Header / Banner Area */}
      <div className="relative w-full h-[40vh] min-h-[300px] bg-muted">
        {company.headerImage ? (

           <Media resource={company.headerImage} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
             <span className="text-6xl font-bold text-white/10 tracking-widest uppercase">
               {company.displayName}
             </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full container mx-auto px-4 pb-12">
           <div className="flex flex-col md:flex-row gap-8 items-end md:items-center">
              {/* Logo */}
              <div className="relative -mb-6 md:mb-0 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-background rounded-2xl shadow-xl overflow-hidden border-4 border-background flex items-center justify-center">
                   {company.logo ? (

                      // @ts-expect-error - Media component types regarding width/height props
                      <Media resource={company.logo} width={160} height={160} className="p-2 object-contain" />
                   ) : (
                      <span className="text-4xl font-bold text-primary">{company.displayName?.charAt(0) || 'G'}</span>
                   )}
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-grow mb-6 md:mb-0">
                 <h1 className="text-4xl md:text-5xl font-bold mb-2">{company.displayName || company.legalName}</h1>
                 {company.slogan && (
                   <p className="text-xl text-foreground/80 font-medium">{company.slogan}</p>
                 )}
                 {company.city && (
                   <div className="flex items-center text-foreground/80 mt-4 font-medium md:text-lg">
                      <MapPin className="w-5 h-5 mr-1.5 text-primary shrink-0" />
                      <span>{company.street} {company.houseNumber}, {company.zipCode} {company.city}</span>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Main Content: Offers */}
            <div className="lg:col-span-8">
                <h2 className="text-3xl font-bold mb-8">Gutscheine & Angebote</h2>
                
                {sanitizedOffers.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground mb-4">Aktuell keine aktiven Gutschein-Angebote.</p>
                        <Button variant="outline" asChild>
                            <Link href="/shops">Andere Shops entdecken</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sanitizedOffers.map((offer: GiftCardOffer) => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar: Details */}
            <div className="lg:col-span-4 space-y-8">
                
                {/* 1. Contact Info */}
                <div className="bg-muted/30 p-6 rounded-xl border">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                        Kontakt & Info
                    </h3>
                    <div className="space-y-4">
                        {company.street && (
                             <div className="flex items-start">
                                <MapPin className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-foreground">{company.street} {company.houseNumber}</p>
                                    <p className="text-muted-foreground">{company.zipCode} {company.city}</p>
                                    {company.country && company.country !== 'Deutschland' && (
                                        <p className="text-muted-foreground">{company.country}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {company.email && (
                            <div className="flex items-center">
                                <Mail className="w-5 h-5 text-primary mr-3 shrink-0" />
                                <a href={`mailto:${company.email}`} className="hover:underline text-sm font-medium">{company.email}</a>
                            </div>
                        )}
                         {company.phone && (
                            <div className="flex items-center">
                                <Phone className="w-5 h-5 text-primary mr-3 shrink-0" />
                                <a href={`tel:${company.phone}`} className="hover:underline text-sm font-medium">{company.phone}</a>
                            </div>
                        )}
                        {company.website && (
                             <div className="flex items-center">
                                <Globe className="w-5 h-5 text-primary mr-3 shrink-0" />
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm font-medium truncate">
                                    Website besuchen
                                </a>
                            </div>
                        )}
                        {company.googleBusinessUrl && (
                             <div className="flex items-center">
                                <MapPin className="w-5 h-5 text-primary mr-3 shrink-0" />
                                <a href={company.googleBusinessUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm font-medium">
                                    Auf Google Maps
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. About & Tags */}
                {(company.description || companyTags.length > 0) && (
                    <div className="bg-muted/30 p-6 rounded-xl border">
                         <h3 className="font-bold text-lg mb-4">Über {company.displayName}</h3>
                         
                         {company.description && (
                             <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed mb-6">
                                 {company.description}
                             </p>
                         )}

                         {companyTags.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                 {companyTags.map(tag => (
                                     <Badge key={tag.id} variant="secondary" className="px-2 py-0.5">
                                         {tag.name}
                                     </Badge>
                                 ))}
                             </div>
                         )}
                    </div>
                )}
                
                {/* 3. Social Media */}
                {(company.instagramUrl || company.facebookUrl || company.linkedinUrl || company.twitterUrl || company.youtubeUrl) && (
                    <div className="bg-muted/30 p-6 rounded-xl border">
                        <h3 className="font-bold text-lg mb-4">Social Media</h3>
                        <div className="flex flex-col gap-2">
                            {company.instagramUrl && (
                                <Button variant="ghost" size="sm" className="justify-start px-2 h-9 hover:bg-white/50 w-full" asChild>
                                    <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer">
                                        <Instagram className="w-4 h-4 mr-3 text-[#E1306C]" /> Instagram
                                    </a>
                                </Button>
                            )}
                             {company.facebookUrl && (
                                <Button variant="ghost" size="sm" className="justify-start px-2 h-9 hover:bg-white/50 w-full" asChild>
                                    <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer">
                                        <Facebook className="w-4 h-4 mr-3 text-[#1877F2]" /> Facebook
                                    </a>
                                </Button>
                            )}
                            {company.linkedinUrl && (
                                <Button variant="ghost" size="sm" className="justify-start px-2 h-9 hover:bg-white/50 w-full" asChild>
                                    <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="w-4 h-4 mr-3 text-[#0A66C2]" /> LinkedIn
                                    </a>
                                </Button>
                            )}
                             {company.twitterUrl && (
                                <Button variant="ghost" size="sm" className="justify-start px-2 h-9 hover:bg-white/50 w-full" asChild>
                                    <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer">
                                        <Twitter className="w-4 h-4 mr-3 text-[#1DA1F2]" /> Twitter / X
                                    </a>
                                </Button>
                            )}
                             {company.youtubeUrl && (
                                <Button variant="ghost" size="sm" className="justify-start px-2 h-9 hover:bg-white/50 w-full" asChild>
                                    <a href={company.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                        <Youtube className="w-4 h-4 mr-3 text-[#FF0000]" /> YouTube
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. Legal / Rechtliches */}
                {(company.legalName || company.managingDirector || company.commercialRegister || company.vatId || company.imprintUrl || company.privacyPolicyUrl || company.termsUrl) && (
                    <div className="bg-muted/30 p-6 rounded-xl border">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Rechtliches
                        </h3>
                        
                        <div className="space-y-4 text-sm">
                            {company.legalName && (
                                <div>
                                    <span className="block text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-0.5">Offizieller Firmenname</span>
                                    <span className="font-medium">{company.legalName}</span>
                                </div>
                            )}

                            {company.managingDirector && (
                                <div>
                                    <span className="block text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-0.5">Geschäftsführung</span>
                                    <span className="font-medium">{company.managingDirector}</span>
                                </div>
                            )}
                            
                            {(company.commercialRegister || company.vatId) && (
                                <div className="grid grid-cols-1 gap-2">
                                    {company.commercialRegister && (
                                        <div>
                                            <span className="text-muted-foreground">Register: </span>
                                            <span className="font-medium">{company.commercialRegister}</span>
                                        </div>
                                    )}
                                    {company.vatId && (
                                        <div>
                                            <span className="text-muted-foreground">USt-ID: </span>
                                            <span className="font-medium font-mono">{company.vatId}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(company.imprintUrl || company.privacyPolicyUrl || company.termsUrl) && (
                                <div className="pt-2 flex flex-col gap-2 border-t mt-2">
                                    {company.imprintUrl && (
                                        <a href={company.imprintUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                                            <FileText className="w-4 h-4 mr-2" /> Impressum
                                        </a>
                                    )}
                                    {company.privacyPolicyUrl && (
                                        <a href={company.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                                            <FileText className="w-4 h-4 mr-2" /> Datenschutz
                                        </a>
                                    )}
                                    {company.termsUrl && (
                                        <a href={company.termsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                                            <FileText className="w-4 h-4 mr-2" /> AGB
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  )
}
