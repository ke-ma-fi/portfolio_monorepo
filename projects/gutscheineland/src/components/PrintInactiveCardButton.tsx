'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export const PrintInactiveCardButton = ({ offerId }: { offerId: string }) => {
  const [loading, setLoading] = useState(false)


  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-inactive-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler beim Erstellen')
      }
      
      const data = await res.json()
      if (data.uuid) {
        window.open(`/print/${data.uuid}`, '_blank')
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err)
      alert(`Konnte inaktive Karte nicht erstellen: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted/30 border rounded-xl p-6 mt-6">
       <div className="flex items-start gap-4">
         <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Printer className="w-6 h-6" />
         </div>
         <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-bold text-foreground">Ausdrucken & Verschenken</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Erstelle jetzt einen inaktiven Gutschein zum Ausdrucken und Verschenken. 
                Die Aktivierung und Bezahlung erfolgt später durch Scannen des QR-Codes.
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleCreate} 
              disabled={loading} 
              className="w-full sm:w-auto gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              {loading ? 'Erstelle...' : 'Karte erstellen & Drucken'}
            </Button>
         </div>
       </div>
    </div>
  )
}
