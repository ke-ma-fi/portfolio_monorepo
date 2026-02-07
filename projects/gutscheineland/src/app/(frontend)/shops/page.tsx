import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CompanyCard } from './CompanyCard'
import { Company } from '@/payload-types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { CompaniesSlug } from '@/slugs'

export const dynamic = 'force-dynamic'

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: query } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const { docs: companies } = await payload.find({
    collection: CompaniesSlug,
    where: {
      isActive: {
        equals: true,
      },
      ...(query
        ? {
            or: [
              {
                displayName: {
                  contains: query,
                },
              },
              {
                city: {
                  contains: query,
                },
              },
            ],
          }
        : {}),
    },
    sort: 'displayName',
    depth: 1,
    limit: 100,
  })

  // Ensure data is serializable
  const sanitizedCompanies = JSON.parse(JSON.stringify(companies))

  return (
    <div className="container pt-32 pb-24 mx-auto px-4">
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl font-bold mb-4">Unsere Partnerunternehmen</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Entdecke lokale Geschäfte, Restaurants und Dienstleister in deiner Nähe.
        </p>

        <form className="flex gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                    name="q" 
                    placeholder="Suchen nach Name oder Stadt..." 
                    defaultValue={query || ''} 
                    className="pl-10"
                />
            </div>
            <Button type="submit">Suchen</Button>
        </form>
      </div>

      {sanitizedCompanies.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            {query 
                ? `Keine Unternehmen für "${query}" gefunden.` 
                : "Aktuell sind keine Unternehmen gelistet."}
          </p>
          {query && (
              <Button variant="link" asChild className="mt-2">
                  <Link href="/shops">Alle anzeigen</Link>
              </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sanitizedCompanies.map((company: Company) => (
            <div key={company.id} className="h-full">
                <CompanyCard company={company} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
