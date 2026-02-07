import { Metadata } from 'next'
import RecoverForm from './RecoverForm'

export const metadata: Metadata = {
  title: 'Gutscheine wiederherstellen | Gutscheineland',
  description: 'Lasse dir deine Gutscheine erneut per E-Mail zusenden.',
}

export default function RecoverPage() {
  return (
    <div className="container max-w-lg pt-32 pb-16 mx-auto px-4">
       <h1 className="text-3xl font-bold mb-6">Gutscheine wiederherstellen</h1>
       <p className="text-muted-foreground mb-8">
         Gib deine E-Mail-Adresse ein, um einen Link zu all deinen aktiven Gutscheinen zu erhalten.
       </p>
       <RecoverForm />
    </div>
  )
}