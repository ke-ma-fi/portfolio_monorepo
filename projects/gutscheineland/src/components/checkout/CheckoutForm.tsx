'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GiftCardOffer } from '@/payload-types'
import { Lock, CreditCard, Gift } from 'lucide-react'
import { createCheckoutSessionAction } from '@/actions/payments'

type CheckoutFormProps = {
  offer: GiftCardOffer
  formattedPrice: string
  existingCardUuid?: string
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  offer,
  formattedPrice,
  existingCardUuid,
}) => {
  const [email, setEmail] = useState('')
  const [isGift, setIsGift] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await createCheckoutSessionAction(
        offer.id,
        email,
        {
          isGift,
          recipientName,
          recipientEmail,
          message,
        },
        existingCardUuid,
      )

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error('No checkout URL received.')
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Ein Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  // Check if we should lock gifting (e.g. activating a physical card)
  // Logic: If existingCardUuid is present, we assume it's a physical card activation?
  // User Requirement: "when scanning the qr and paying you can deside to send it as a digital giftcard i feel like we should not allow that."
  // So if activating (existingCardUuid present), force isGift = false / disabled.
  const isActivation = Boolean(existingCardUuid)

  return (
    <Card className="border-2 border-primary shadow-xl">
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          {existingCardUuid ? 'Karte aktivieren & bezahlen' : 'Sicher bezahlen'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Order Summary */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{offer.title}</span>
          <span className="font-bold">{formattedPrice}</span>
        </div>
        {existingCardUuid && (
          <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs font-medium border border-blue-100">
            Du aktivierst eine bestehende Karte.
          </div>
        )}
        <hr className="border-border border-dashed" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Deine E-Mail-Adresse (Rechnung)</Label>
            <Input
              id="email"
              type="email"
              placeholder="max@mustermann.de"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              An diese Adresse senden wir die Kaufbestätigung{isGift ? '' : ' und den Gutschein'}.
            </p>
          </div>

          {!isActivation && (
            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
              <Checkbox
                id="isGift"
                checked={isGift}
                onCheckedChange={(checked) => setIsGift(checked as boolean)}
              />
              <Label htmlFor="isGift" className="flex items-center gap-2 cursor-pointer font-medium">
                <Gift className="w-4 h-4 text-primary" />
                Als Geschenk versenden
              </Label>
            </div>
          )}
          
          {isActivation && (
             <div className="text-[10px] text-muted-foreground border p-2 rounded bg-gray-50">
               Hinweis: Physische Karten können beim Aktivieren nicht digital versendet werden.
             </div>
          )}

          {isGift && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Name des Empfängers</Label>
                <Input
                  id="recipientName"
                  placeholder="Erika Mustermann"
                  required={isGift}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">E-Mail des Empfängers</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="erika@beispiel.de"
                  required={isGift}
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Der Gutschein wird sofort an diese Adresse gesendet.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Persönliche Nachricht (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Alles Gute zum Geburtstag!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? (
              'Wird verarbeitet...'
            ) : (
              <span className="flex items-center gap-2">
                Mit Stripe bezahlen <CreditCard className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Durch Klick auf &quot;Bezahlen&quot; akzeptierst du unsere AGB und Datenschutzbestimmungen.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
