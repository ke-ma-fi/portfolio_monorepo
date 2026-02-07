'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Printer, Gift, CreditCard, AlertTriangle, Mail, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { markAsPrintedAction } from '@/actions/cards'
import { sendGiftCardAction, resendGiftEmailAction, registerRecipientAction } from '@/actions/gifting'
import { generateGoogleWalletLinkAction } from '@/actions/wallet'
import { Media } from '@/payload-types'

type CardDisplayProps = {
  card: any // eslint-disable-line @typescript-eslint/no-explicit-any
  viewMode: 'buyer' | 'recipient'
  qrUrl: string
}

export default function CardDisplay({ card, viewMode, qrUrl }: CardDisplayProps) {
  const [loading, setLoading] = useState(false)
  const [showGiftForm, setShowGiftForm] = useState(false)
  const [showPrintConfirm, setShowPrintConfirm] = useState(false)
  
  // Form State
  const [email, setEmail] = useState(card.recipientEmail || '')
  const [name, setName] = useState(card.recipientName || '')
  const [messageText, setMessageText] = useState(card.message || '')
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Derived State
  // "Transferred" means the buyer has physically printed it OR sent it digitally.
  // In either case, the buyer loses strict ownership (credentials rotated).
  const isTransferred = Boolean(viewMode === 'buyer' && (card.giftedAt || card.printedAt))
  const isInactive = card.status === 'inactive'
  
  const company = typeof card.company === 'object' ? card.company : null
  const companyName = (company?.displayName || company?.legalName) || 'Gutscheineland'

  // Branding Extras
  const primaryColor = company?.primaryColor || '#E01035'
  const secondaryColor = company?.secondaryColor || '#8C30F5'
  const logo = company?.logo as Media | undefined
  const logoUrl = logo?.sizes?.square?.url || logo?.url

  const formattedBalance = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(card.remainingBalance)
  const formattedOriginalValue = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(card.originalValue)
  const expiryDate = card.expiryDate ? new Date(card.expiryDate).toLocaleDateString('de-DE') : 'Unbegrenzt'


  const handlePrintRequest = () => {
    if (viewMode === 'recipient') {
       window.open(`/print/${card.uuid}`, '_blank')
    } else {
       // Buyer needs confirmation
       setShowPrintConfirm(true)
    }
  }

  const confirmPrint = async () => {
    setLoading(true)
    try {
      const res = await markAsPrintedAction(card.uuid)
      if (res.error) throw new Error(res.error)
      // On success, redirect to print page. The page reload will also reflect "transferred" state on back button.
      // But we should probably reload the current page state too.
      // Easiest is to open print in new tab and reload this page?
      // Or just navigate.
      window.location.href = `/print/${card.uuid}`
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setFormMessage({ type: 'error', text: 'Fehler: ' + err.message })
      setShowPrintConfirm(false)
      setLoading(false)
    }
  }

  const handleSendGift = async () => {
    setLoading(true)
    setFormMessage(null)
    try {
      const res = await sendGiftCardAction(card.uuid, email, name, messageText)
      if (res.error) throw new Error(res.error)
      
      setFormMessage({ type: 'success', text: 'Gutschein erfolgreich versendet!' })
      // Delay to show success
      setTimeout(() => {
         window.location.reload() // Reload to fetch new state (giftedAt)
      }, 1500)
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setFormMessage({ type: 'error', text: 'Fehler: ' + err.message })
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    try {
        const res = await resendGiftEmailAction(card.uuid)
        if (res.error) throw new Error(res.error)
         setFormMessage({ type: 'success', text: 'E-Mail wurde erneut gesendet.' })
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setFormMessage({ type: 'error', text: 'Fehler: ' + err.message })
    } finally {
        setLoading(false)
    }
  }

  const handleAppleWallet = () => {
    window.location.href = `/api/wallet/apple/${card.uuid}`
  }

  const handleGoogleWallet = async () => {
    setLoading(true)
    try {
      const res = await generateGoogleWalletLinkAction(card.uuid)
      if (res.error) throw new Error(res.error)
      if (res.url) window.open(res.url, '_blank')
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setFormMessage({ type: 'error', text: 'Wallet Fehler: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterRecipient = async () => {
    setLoading(true)
    setFormMessage(null)
    try {
        const res = await registerRecipientAction(card.uuid, email) // Note: using email state variable
        if (res.error) throw new Error(res.error)
        setFormMessage({ type: 'success', text: 'Gutschein erfolgreich gesichert!' })
        // Reload to update state
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setFormMessage({ type: 'error', text: 'Fehler: ' + err.message })
    } finally {
        setLoading(false)
    }
  }

  // --- RENDER HELPERS ---

  if (showPrintConfirm) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Gutschein drucken?</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                            Wenn du diesen Gutschein ausdruckst, wird er als <strong>übergeben</strong> markiert.
                            Der digitale Zugriff (QR-Code & Bearbeitung) wird hier für dich gesperrt, um Sicherheit zu gewährleisten. 
                            Der Gutschein ist dann nur noch über den Ausdruck einlösbar.
                        </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 bg-white" onClick={() => setShowPrintConfirm(false)}>Abbrechen</Button>
                        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={confirmPrint} disabled={loading}>
                            {loading ? 'Drucke...' : 'Ausdrucken & Sperren'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  const showRecipientClaim = viewMode === 'recipient' && !card.recipientEmail

  return (<div className="print:p-0">
      <div className="relative w-full max-w-sm mx-auto perspective-1000">
        
        {/* Helper to calculate contrast color - very basic */}
        {/* We use CSS variables or style props */}
        
        <Card 
            className="relative overflow-hidden border-0 shadow-[0_8px_40px_rgba(0,0,0,0.15)] rounded-[2rem] text-white"
            style={{ 
                background: `linear-gradient(145deg, ${primaryColor}, ${secondaryColor})`,
            }}
        >
          {/* Noise / Texture Overlay */}
          <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none mix-blend-overlay" />

          {/* Header */}
          <div className="relative z-10 p-8 pb-0 flex flex-col items-center text-center">
             
             {/* Logo Circle */}
             {logoUrl && (
                 <div className="mb-4 bg-white p-3 rounded-full shadow-lg h-20 w-20 flex items-center justify-center">
                    <Image 
                        src={logoUrl} 
                        alt={companyName} 
                        width={64} 
                        height={64} 
                        className="object-contain max-h-14 max-w-14"
                    />
                 </div>
             )}

             <h2 className="text-2xl font-black tracking-tight drop-shadow-md mb-2">
               {companyName}
             </h2>
             
             {isInactive ? (
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20 shadow-sm">
                 Noch nicht aktiviert
               </span>
             ) : isTransferred ? (
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/80 backdrop-blur-md border border-white/20 shadow-sm">
                 {card.printedAt ? 'Ausgedruckt' : 'Verschenkt'}
               </span>
             ) : viewMode === 'buyer' ? (
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20 shadow-sm">
                 Mein Gutschein
               </span>
             ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/80 backdrop-blur-md border border-emerald-400/50 shadow-sm">
                  Gültig
                </span>
             )}
          </div>
        
        <CardContent className="relative z-10 flex flex-col items-center pt-8 pb-8 space-y-8">
          
          {/* MAIN CONTENT AREA */}
          {isInactive ? (
             <div className="bg-white/90 text-black p-8 rounded-xl shadow-xl text-center max-w-xs">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm font-bold">Bereit zur Aktivierung</p>
                {card.printedAt && (
                    <p className="text-xs text-slate-500 mt-2">
                        Ausgedruckt am {new Date(card.printedAt).toLocaleDateString('de-DE')}
                    </p>
                )}
             </div>
          ) : showRecipientClaim ? (
               /* RECIPIENT CLAIM FORM */
               <div className="bg-white/95 text-black p-6 rounded-xl shadow-xl border border-white/20 text-center max-w-xs w-full">
                 <h3 className="font-bold mb-2 text-emerald-800">Gutschein sichern</h3>
                 <p className="text-xs text-slate-500 mb-4">
                    Speichere den Gutschein, damit er nicht verloren geht.
                 </p>
                 <div className="space-y-3 text-left">
                   <div>
                     <Label className="text-xs text-slate-600">Deine E-Mail Adresse</Label>
                     <Input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="email@beispiel.de" 
                        className="h-8 bg-slate-50 border-slate-200 text-black" 
                     />
                   </div>
                   <Button size="sm" onClick={handleRegisterRecipient} disabled={loading} className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                     {loading ? 'Speichere...' : 'Jetzt sichern'}
                   </Button>
                 </div>
               </div>
          ) : showGiftForm ? (
             <div className="bg-white/95 text-black p-6 rounded-xl shadow-xl text-center max-w-xs w-full">
               <h3 className="font-bold mb-4">Gutschein verschenken</h3>
               <div className="space-y-3 text-left">
                  <div>
                    <Label className="text-xs text-slate-600">Name des Empfängers</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-8 bg-slate-50 border-slate-200 text-black" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">E-Mail Adresse</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@beispiel.de" className="h-8 bg-slate-50 border-slate-200 text-black" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Nachricht</Label>
                    <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="..." rows={2} className="bg-slate-50 border-slate-200 text-black resize-none text-xs" />
                  </div>
                  {/* Warning */}
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded leading-tight border border-amber-100">
                    Achtung: Nach dem Senden kannst du den Empfänger nicht mehr ändern und siehst den Code nicht mehr.
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSendGift} disabled={loading} className="flex-1 text-xs bg-slate-900 text-white">
                      {loading ? 'Sende...' : 'Senden'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowGiftForm(false)} disabled={loading} className="text-xs hover:bg-slate-100 text-slate-700">
                       Abbrechen
                    </Button>
                  </div>
               </div>
             </div>
          ) : isTransferred ? (
             <div className="bg-white/90 text-black p-8 rounded-xl shadow-xl text-center max-w-xs w-full">
                <Gift className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-800">
                    {card.printedAt ? 'Wurde ausgedruckt am' : 'Versendet an'}
                </p>
                {card.printedAt && (
                   <p className="font-bold">{new Date(card.printedAt).toLocaleDateString('de-DE')}</p>
                )}
                {card.giftedAt && !card.printedAt && (
                   <>
                    <p className="font-bold mt-1 text-lg">{card.recipientName}</p>
                    <p className="text-xs text-slate-500">{card.recipientEmail}</p>
                    <p className="text-[10px] text-slate-400 mt-2">am {new Date(card.giftedAt).toLocaleDateString('de-DE')}</p>
                   </>
                )}
             </div>
          ) : (
             /* DEFAULT QR VIEW */
             <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
               <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin={false} />
             </div>
          )}

          {/* Amount Display */}
          <div className="text-center space-y-1 drop-shadow-sm">
            <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-1">
              Aktuelles Guthaben
            </p>
            <p className="text-5xl font-black text-white tracking-tight">{formattedBalance}</p>
          </div>

          {/* Info Grid */}
          <div className="w-full grid grid-cols-2 gap-3 text-center text-sm">
            {!isTransferred && (
                <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-sm">
                <p className="text-white/70 text-[10px] uppercase font-bold mb-1">Code</p>
                <p className="font-mono font-bold tracking-wider text-lg">{card.code}</p>
                </div>
            )}
             {isTransferred && (
                <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-sm">
                 <p className="text-white/70 text-[10px] uppercase font-bold mb-1">Status</p>
                 <p className="font-bold text-lg">Übergeben</p>
                </div>
             )}

            <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-sm">
                  <p className="text-white/70 text-[10px] uppercase font-bold mb-1">Wert</p>
                  <p className="font-bold text-lg">{formattedOriginalValue}</p>
            </div>
            
            <div className="col-span-2 bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-sm">
               <p className="text-white/70 text-[10px] uppercase font-bold mb-1">Gültig bis</p>
               <p className="font-bold text-lg">{expiryDate}</p>
            </div>
          </div>
          
          {formMessage && (
             <div className={`text-sm px-4 py-2 rounded-lg w-full text-center font-medium shadow-sm ${formMessage.type === 'success' ? 'bg-white text-green-700' : 'bg-white text-red-700'}`}>
                {formMessage.text}
             </div>
          )}

        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 bg-black/20 backdrop-blur-md p-6 print:hidden border-t border-white/10">
          
          {/* Wallet: Only for Active, Non-Transferred (or Recipient) */}
          {!isInactive && (viewMode === 'recipient' || !isTransferred) && (
             <div className="w-full flex flex-row flex-wrap gap-4 justify-center mb-4">
                 <button onClick={handleAppleWallet} className="transition-transform active:scale-95 hover:opacity-90 hover:scale-[1.02]">
                     <Image 
                        src="/DE_Add_to_Apple_Wallet_RGB_101421.svg" 
                        alt="Zu Apple Wallet hinzufügen" 
                        width={140} 
                        height={44}
                        className="h-[44px] w-auto drop-shadow-sm"
                     />
                 </button>
                 <button onClick={handleGoogleWallet} className="transition-transform active:scale-95 hover:opacity-90 hover:scale-[1.02]">
                      <Image 
                        src="/de_add_to_google_wallet_add-wallet-badge.svg" 
                        alt="In Google Wallet speichern" 
                        width={140} 
                        height={44}
                        className="h-[44px] w-auto drop-shadow-sm"
                     />
                 </button>
             </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
             
             {/* INACTIVE: Activate */}
             {isInactive && (
                <Button asChild className="w-full h-12 text-lg font-bold shadow-lg bg-white text-black hover:bg-slate-100 border-0">
                   <Link href={`/shops/${(typeof card.company === 'object' ? card.company?.slug : 'unknown')}/buy/${typeof card.offer === 'object' ? card.offer.id : card.offer}?activate=${card.uuid}`}>Jetzt aktivieren</Link>
                </Button>
             )}

             {/* TRANSFERRED BUYER VIEW */}
             {isTransferred && (
                <>
                  {card.giftedAt && (
                      <Button variant="outline" onClick={handleResendEmail} disabled={loading} className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                          <Mail className="w-4 h-4 mr-2" /> E-Mail erneut senden
                      </Button>
                  )}
                  <Button variant="ghost" asChild className="text-white/60 hover:text-white hover:bg-white/10">
                      <a href="mailto:support@gutscheineland.de?subject=Hilfe%20Gutschein%20Reset">
                          <HelpCircle className="w-4 h-4 mr-2" /> Support / Problem melden
                      </a>
                  </Button>
                </>
             )}

             {/* ACTIVE OWNER VIEW */}
             {!isInactive && !isTransferred && !showGiftForm && viewMode === 'buyer' && (
                <>
                  <Button onClick={handlePrintRequest} variant="outline" className="w-full h-12 text-base gap-2 font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/30 backdrop-blur-sm transition-all shadow-sm">
                    <Printer className="w-5 h-5" />
                    Ausdrucken (als Geschenk)
                  </Button>
                  <Button onClick={() => setShowGiftForm(true)} className="w-full h-12 text-base gap-2 font-bold bg-white text-black hover:bg-slate-100 hover:text-black border-0 shadow-lg transition-all">
                    <Gift className="w-5 h-5" />
                    Digital verschenken
                  </Button>
                </>
             )}

             {/* RECIPIENT VIEW */}
             {viewMode === 'recipient' && (
                <Button onClick={handlePrintRequest} variant="outline" className="w-full h-12 text-base gap-2 font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/30 backdrop-blur-sm transition-all shadow-sm">
                    <Printer className="w-5 h-5" />
                    Drucken / Speichern
                </Button>
             )}
          </div>
        </CardFooter>
      </Card>

      {/* Powered By Footer */}
      <div className="w-full text-center mt-12 pb-12">
         <Link href="/" className="inline-flex flex-row items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-300 group">
             <p className="text-sm uppercase tracking-[0.2em] text-slate-400 font-heading font-bold mb-0 group-hover:text-slate-600 transition-colors">Powered By</p>
             <Image 
                src="/favicon.svg" 
                alt="Gutscheineland" 
                width={20} 
                height={20} 
                className="h-5 w-5 grayscale group-hover:grayscale-0 transition-all duration-300"
             />
         </Link>
      </div>

      </div>
    </div>
  )
}

