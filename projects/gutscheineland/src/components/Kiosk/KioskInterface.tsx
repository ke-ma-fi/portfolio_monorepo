'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { scanCardAction, redeemCardAction } from '@/actions/merchant'
import { activateCardAction } from '@/actions/kiosk'
import { Search, CheckCircle2, ArrowRight } from 'lucide-react'

type KioskStep = 'SCAN' | 'ACTION' | 'SUCCESS'

export default function KioskInterface() {
  const [step, setStep] = useState<KioskStep>('SCAN')
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cardData, setCardData] = useState<any | null>(null) 
  const [amount, setAmount] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // -- 1. SCANNER LOGIC --
  useEffect(() => {
    if (step === 'SCAN' && !scanResult && !scannerRef.current) {
      const timer = setTimeout(() => {
        const element = document.getElementById('reader')
        if (!element) return

        // Clear any lingering instance
        try {
            if (scannerRef.current) { 
                scannerRef.current.clear().catch(() => {})
                scannerRef.current = null 
            }
        } catch (e) { console.error(e) }

        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        )
        
        scanner.render((decodedText) => {
          setScanResult(decodedText)
          scanner.clear().catch(console.error)
          scannerRef.current = null
          handleFetchCard(decodedText)
        }, (err) => {
           // ignore repeated scan errors
        })
        
        scannerRef.current = scanner
      }, 500) // slight delay to ensure DOM is ready

      return () => clearTimeout(timer)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [step, scanResult]) // Re-run when step changes back to SCAN

  const handleFetchCard = async (identifier: string) => {
    setLoading(true)
    setError('')
    try {
        // Handle URL inputs
        if (identifier.includes('/view/')) {
            const parts = identifier.split('/view/')
            if (parts[1]) {
                identifier = parts[1].split('/')[0] || identifier
            }
        }

        const result = await scanCardAction(identifier) // Reusing existing action which is fine
        
        if (result.error) {
            throw new Error(result.error)
        }
        
        if (result.data) {
            setCardData(result.data)
            // Pre-fill amount with remaining balance if active
            if (result.data.status === 'active') {
                setAmount(result.data.remainingBalance.toString())
            }
            setStep('ACTION')
        }
    } catch (e: any) {
        setError(e.message || 'Karte nicht gefunden')
        // Reset scan to allow retry
        setScanResult(null)
    } finally {
        setLoading(false)
    }
  }

  const handleManualSearch = () => {
    if (!manualCode.trim()) return
    if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
    }
    handleFetchCard(manualCode.trim())
  }

  // -- 2. ACTIONS LOGIC --

  const handleActivate = async () => {
    if (!cardData) return
    setLoading(true)
    setError('')
    try {
        const result = await activateCardAction(cardData.code, { customerEmail: customerEmail || undefined })
        if (result.error) throw new Error(result.error)
        
        setCardData({ ...cardData, status: 'active', remainingBalance: cardData.originalValue || result.data?.balance })
        setSuccessMessage('Karte erfolgreich aktiviert!')
        setStep('SUCCESS')
    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!cardData || !amount) return
    setLoading(true)
    setError('')
    try {
        // Validate format using string pattern before parsing
        const normalizedAmount = amount.replace(',', '.')
        
        // Check format: digits with optional decimal point and 1-2 decimal places
        if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
          throw new Error('Betrag darf maximal 2 Nachkommastellen haben')
        }
        
        // Parse and validate the amount
        const val = parseFloat(normalizedAmount)
        
        // Comprehensive validation
        if (isNaN(val)) {
          throw new Error('Ungültiger Betrag eingegeben')
        }
        if (val <= 0) {
          throw new Error('Betrag muss größer als 0 sein')
        }
        if (val > 999999) {
          throw new Error('Betrag ist zu groß')
        }
        if (cardData.remainingBalance && val > cardData.remainingBalance) {
          throw new Error(`Betrag überschreitet verbleibendes Guthaben von ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cardData.remainingBalance)}`)
        }
        
        const result = await redeemCardAction(cardData.uuid, val)
        if (result.error) throw new Error(result.error)

        setSuccessMessage(`Erfolgreich ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val)} abgebucht!`)
        setStep('SUCCESS')
    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
  }

  const reset = () => {
    setStep('SCAN')
    setScanResult(null)
    setManualCode('')
    setCardData(null)
    setAmount('')
    setCustomerEmail('')
    setError('')
    setSuccessMessage('')
  }

  // -- RENDERERS --

  if (step === 'SCAN') {
    return (
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-primary/5 pb-6">
                <CardTitle className="text-center text-2xl font-black uppercase tracking-tight">Kiosk Scanner</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="relative aspect-square bg-black rounded-2xl overflow-hidden shadow-inner border-2 border-primary/10">
                    <div id="reader" className="w-full h-full"></div>
                    {loading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm z-10">
                            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold text-sm animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div className="relative">
                        <Input 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                            placeholder="Code manuell eingeben..."
                            className="h-14 pl-4 pr-14 text-lg font-mono uppercase rounded-xl border-2 focus-visible:ring-primary/20"
                        />
                        <Button 
                            className="absolute right-2 top-2 h-10 w-10 rounded-lg p-0"
                            onClick={handleManualSearch}
                            disabled={!manualCode || loading}
                        >
                            <Search className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }

  if (step === 'ACTION' && cardData) {
      return (
          <Card className="w-full max-w-lg border-0 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className={`h-2 w-full ${cardData.status === 'active' ? 'bg-green-500' : cardData.status === 'inactive' ? 'bg-blue-500' : 'bg-gray-500'}`} />
             <CardHeader className="text-center pb-2">
                 <div className="inline-flex items-center justify-center px-3 py-1 bg-muted rounded-full text-xs font-mono mb-2">
                    {cardData.code}
                 </div>
                 <CardTitle className="text-3xl font-black">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cardData.remainingBalance)}
                 </CardTitle>
                 <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    {cardData.status === 'active' ? 'Verfügbares Guthaben' : 
                     cardData.status === 'inactive' ? 'Kartenwert (Bezahlung ausstehend)' : 
                     'Guthaben'}
                 </p>
             </CardHeader>

            <CardContent className="p-8 space-y-6">
                 {/* INACTIVE -> ACTIVATE */}
                 {cardData.status === 'inactive' && (
                     <div className="space-y-6">
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium">
                            Diese Karte ist noch <strong>nicht aktiviert</strong>. Nach Bezahlung kann sie hier direkt aktiviert werden.
                        </div>

                        <div className="space-y-2">
                            <Label>Kunden E-Mail (Optional)</Label>
                            <Input 
                                type="email"
                                placeholder="kunde@beispiel.de"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="h-12 rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">Für Wiederherstellungs-Link und Bestätigung.</p>
                        </div>

                        <Button size="lg" className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700" onClick={handleActivate} disabled={loading}>
                            {loading ? 'Aktiviere...' : 'Jetzt aktivieren & Kassieren'}
                        </Button>
                     </div>
                 )}

                 {/* ACTIVE -> REDEEM */}
                 {cardData.status === 'active' && (
                     <div className="space-y-6">
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Labels className="flex justify-between">
                                    <span>Einlöse-Betrag</span>
                                    <span className="text-xs text-muted-foreground cursor-pointer underline" onClick={() => setAmount(cardData.remainingBalance.toString())}>
                                        Alles ({cardData.remainingBalance}€)
                                    </span>
                                </Labels>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">€</span>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-16 pl-10 text-2xl font-bold rounded-xl"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button size="lg" className="w-full h-16 text-xl font-black uppercase tracking-wide shadow-lg shadow-primary/20" onClick={handleRedeem} disabled={loading || !amount || parseFloat(amount) <= 0}>
                                {loading ? 'Buche ab...' : 'Abbuchen'}
                            </Button>
                         </div>
                     </div>
                 )}

                 {/* OTHER STATUS */}
                 {['redeemed', 'expired'].includes(cardData.status) && (
                     <div className="bg-gray-100 p-6 rounded-xl text-center">
                         <p className="text-lg font-bold text-muted-foreground">Diese Karte ist {cardData.status === 'redeemed' ? 'bereits eingelöst' : 'abgelaufen'}.</p>
                     </div>
                 )}
                 
                 {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold text-sm">
                        {error}
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/30 p-4 flex justify-center">
                <Button variant="ghost" onClick={reset} className="text-muted-foreground">Abbrechen & Neuer Scan</Button>
            </CardFooter>
          </Card>
      )
  }

  if (step === 'SUCCESS') {
      return (
        <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden bg-green-600 text-white animate-in zoom-in-50 duration-300">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Erfolgreich!</h2>
                <p className="text-green-100 text-lg font-medium leading-relaxed">{successMessage}</p>
                
                <Button 
                    className="w-full h-14 bg-white text-green-700 hover:bg-green-50 font-bold text-lg mt-8 shadow-xl"
                    onClick={reset}
                >
                    Nächster Kunde <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </CardContent>
        </Card>
      )
  }

  return null
}

function Labels({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={`text-sm font-medium mb-1.5 ${className}`}>{children}</div>
}
