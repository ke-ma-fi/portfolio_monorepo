import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Home, Search, AlertCircle, Loader2 } from 'lucide-react'
import { Metadata } from 'next'
import { verifyOrderAction } from '@/actions/payments'

export const metadata: Metadata = {
  title: 'Bestellstatus | Gutscheineland',
  description: 'Überprüfung deiner Bestellung.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: 'no-referrer',
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const sessionId = typeof params.session_id === 'string' ? params.session_id : undefined

  if (!sessionId) {
    return <ErrorState message="Keine Sitzungs-ID gefunden. Bitte kontaktiere den Support." />
  }

  const result = await verifyOrderAction(sessionId)

  if (result.error || result.status === 'pending') {
    return (
      <ErrorState 
        message={result.error || result.message || 'Verifizierung fehlgeschlagen'} 
        isPending={result.status === 'pending'} 
      />
    )
  }

  // Success State
  return (
    <div className="container max-w-lg pt-32 pb-24 mx-auto px-4 text-center">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold mb-4">Vielen Dank für deine Bestellung!</h1>
      
      <p className="text-muted-foreground text-lg mb-8">
        Wir haben deine Zahlung bestätigt. Dein Gutschein wurde erstellt und per E-Mail an dich versendet.
      </p>

      <Card className="bg-muted/30 border-dashed border-2 mb-8">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-2">Bitte prüfe auch deinen Spam-Ordner.</p>
          <p className="font-medium text-primary">Die E-Mail sollte in wenigen Minuten ankommen.</p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" className="font-bold">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Zur Startseite
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
           <Link href="/shops">
             <Search className="w-4 h-4 mr-2" />
             Weitere Gutscheine
           </Link>
        </Button>
      </div>
    </div>
  )
}

function ErrorState({ message, isPending }: { message: string; isPending?: boolean }) {
  return (
    <div className="container max-w-lg pt-32 pb-24 mx-auto px-4 text-center">
      <div className="flex justify-center mb-6">
        <div className={`rounded-full p-6 ${isPending ? 'bg-blue-100' : 'bg-red-100'}`}>
          {isPending ? (
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          ) : (
            <AlertCircle className="w-16 h-16 text-red-600" />
          )}
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">{isPending ? 'Zahlung wird verarbeitet' : 'Ein Problem ist aufgetreten'}</h1>
      
      <p className="text-muted-foreground mb-8">
        {message}
      </p>

      {isPending ? (
        <Card className="bg-blue-50 border-blue-200 border mb-8">
          <CardContent className="pt-6 text-blue-800 text-sm">
            Deine Zahlung wurde noch nicht bestätigt. Bitte lade die Seite in wenigen Augenblicken neu.
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/shops">Zurück zum Shop</Link>
          </Button>
        </div>
      )}
      
      {isPending && (
         <Button onClick={() => window.location.reload()} variant="outline">
            Seite neu laden
         </Button>
      )}
    </div>
  )
}
