'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resendCardsAction } from '@/actions/recovery'

export default function RecoverForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const result = await resendCardsAction(email)

      if (result.error) throw new Error('Failed to send')
      
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">E-Mail versendet</CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          Falls unter dieser Adresse Gutscheine gefunden wurden, haben wir dir einen Link gesendet. 
          Bitte prüfe auch deinen Spam-Ordner.
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input 
          id="email" 
          type="email" 
          required 
          placeholder="max@mustermann.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>
      
      {status === 'error' && (
        <p className="text-red-600 text-sm">
          Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? 'Wird gesendet...' : 'Link anfordern'}
      </Button>
    </form>
  )
}