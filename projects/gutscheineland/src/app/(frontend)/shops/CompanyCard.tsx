import Link from 'next/link'
import { Media } from '@/components/Media' // Assuming this exists or I should check
import { Company, Tag } from '@/payload-types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, ArrowRight } from 'lucide-react'

export const CompanyCard = ({ company }: { company: Company }) => {
  const { slug, displayName, description, logo, headerImage, city, tags } = company

  return (
    <Link href={`/shops/${slug}`} className="block h-full group">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 border-border/50">
        <div className="relative">
          <div className="relative h-40 overflow-hidden bg-muted rounded-t-xl z-0">
             {headerImage && typeof headerImage !== 'string' ? (
                <div className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105 transform-gpu">
                   <Media resource={headerImage} fill className="object-cover" />
                </div>
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                 <span className="text-4xl font-bold opacity-20">{displayName?.charAt(0)}</span>
               </div>
             )}
          </div>
           <div className="absolute -bottom-6 left-6 z-10">
             <div className="h-16 w-16 rounded-xl border-4 border-background bg-white shadow-sm overflow-hidden flex items-center justify-center">
               {logo && typeof logo !== 'string' ? (
                 // @ts-expect-error - Media component types
                 <Media resource={logo} width={64} height={64} className="object-contain p-1" />
               ) : (
                 <span className="text-xl font-bold text-primary">{displayName?.charAt(0)}</span>
               )}
             </div>
           </div>
        </div>

        <CardHeader className="pt-8 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              {city && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {city}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description || 'Entdecke Gutscheine von diesem Anbieter.'}
          </p>
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.slice(0, 3).map((tag, i) => {
                 if (typeof tag !== 'object') return null
                 const tagObj = tag as Tag
                 return (
                   <Badge key={tagObj.id || i} variant="secondary" className="text-xs">
                     {tagObj.name}
                   </Badge>
                 )
              })}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <div className="w-full flex items-center justify-between text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
             <span>Zum Shop</span>
             <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
