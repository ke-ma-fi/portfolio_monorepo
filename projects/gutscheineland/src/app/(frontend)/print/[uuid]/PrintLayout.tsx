'use client'

import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GiftCardOffer } from '@/payload-types'
import { Media } from '@/components/Media'
import { Gift, AlertTriangle, CheckCircle } from 'lucide-react'

type PrintLayoutProps = {
  card: any // eslint-disable-line @typescript-eslint/no-explicit-any
  offer: GiftCardOffer
  companyName: string
  qrUrl: string
}

export default function PrintLayout({ card, offer, companyName, qrUrl }: PrintLayoutProps) {
  useEffect(() => {
    // Auto-print on load
    const timer = setTimeout(() => {
      window.print()
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const isPaid = card.isPaid
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(card.remainingBalance)

  return (
    <div className="w-[210mm] h-[297mm] bg-white text-black relative mx-auto overflow-hidden print:overflow-visible print-container">
      {/* Print-specific Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide global navigation and utility elements */
          header, 
          footer, 
          .admin-bar,
          nav,
          div[class*="Header"],
          div[class*="Footer"] {
            display: none !important;
          }
          
          /* Target the specific Header wrapper div structure from root layout */
          body > div > div:first-child,
          body > div > header {
            display: none !important;
          }

          /* Reset body and container for printing */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Prevent browser from adding URLs after links */
          a[href]:after {
            content: none !important;
          }

          /* Force printing of background colors and images */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Force A4 Page Size and remove default margins */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Ensure the main container is visible and positioned correctly */
          .print-container {
             display: block !important;
             position: absolute !important;
             top: 0 !important;
             left: 0 !important;
             width: 210mm !important;
             height: 297mm !important;
             z-index: 9999 !important;
          }
        }
      `}} />

      {/* --- TOP HALF: The Card --- */}
      <div className="h-[148.5mm] w-full border-b border-dashed border-gray-300 flex">
        
        {/* Left Side of Card (Back when folded) - 105mm width on page */}
        {/* We rotate content 90deg so it becomes a Landscape Tent Card Back */}
        <div className="w-[105mm] h-full border-r border-gray-100 relative overflow-hidden">
           <div className="origin-top-left rotate-90 translate-x-[105mm] w-[148.5mm] h-[105mm] p-8 flex items-center justify-between bg-white">
              <div className="flex flex-col h-full justify-between py-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Gutschein-Code</h3>
                  <div className="font-mono text-lg font-bold bg-gray-100 px-3 py-1 inline-block rounded">
                    {card.code}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">
                    {isPaid ? 'Gutschein ist aktiv' : 'Gültig nach Aktivierung'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <QRCodeSVG value={qrUrl} size={100} level="H" />
                <p className="text-[9px] text-center mt-2 text-gray-500 max-w-[120px] leading-tight">
                  Scannen zum<br/>{isPaid ? 'Einlösen' : 'Einlösen/Aktivieren'}
                </p>
              </div>

              <div className="text-right flex flex-col h-full justify-between py-2">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Wert</h3>
                 <div className="text-3xl font-extrabold text-primary">{formattedPrice}</div>
              </div>
           </div>
        </div>

        {/* Right Side of Card (Front when folded) - 105mm width on page */}
        {/* We rotate content 90deg so it becomes a Landscape Tent Card Front */}
        <div className="w-[105mm] h-full bg-gray-50 relative overflow-hidden">
           <div className="origin-top-left rotate-90 translate-x-[105mm] w-[148.5mm] h-[105mm] p-8 flex flex-col items-center justify-center relative">
              {/* Decorative Logo / Brand Area */}
              {/* Decorative Logo / Brand Area */}
              <div className="absolute top-4 right-4 opacity-10">
                {card.company?.logo ? (
                  <div className="w-24 h-24 relative">
                    <Media resource={card.company.logo} fill imgClassName="object-contain grayscale" />
                  </div>
                ) : (
                  <Gift className="w-24 h-24" />
                )}
              </div>

              <div className="z-10 text-center w-full">
                {card.company?.logo && (
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <Media resource={card.company.logo} fill imgClassName="object-contain" />
                  </div>
                )}
                <h1 className="text-xl font-bold mb-2 uppercase tracking-wide text-gray-600">{companyName}</h1>
                {!card.company?.logo && <div className="w-12 h-1 bg-primary mx-auto mb-4"></div>}
                <h2 className="text-5xl font-light tracking-tight mb-2 text-gray-900">Gutschein</h2>
                <p className="text-sm text-gray-500 italic">Ein Geschenk für dich</p>
              </div>
              
              <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-gray-300 tracking-widest uppercase">
                gutscheineland.de
              </div>
           </div>
        </div>
      </div>

      {/* --- BOTTOM HALF: Instructions --- */}
      <div className="h-[148.5mm] w-full p-12 bg-white text-gray-700">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-full border ${isPaid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
               {isPaid ? (
                 <CheckCircle className="w-10 h-10 text-green-600" />
               ) : (
                 <AlertTriangle className="w-10 h-10 text-yellow-600" />
               )}
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {isPaid ? 'Gutschein ist aktiv' : 'WICHTIG: Noch nicht aktiviert!'}
              </h2>
              <p className="text-lg">
                {isPaid 
                  ? 'Dieser Gutschein wurde bezahlt und ist sofort gültig. Er kann jederzeit im Geschäft eingelöst werden.'
                  : (
                    <>
                      Dieser Ausdruck ist aktuell noch <strong>wertlos</strong>. Der Gutschein muss erst bezahlt und aktiviert werden.
                    </>
                  )
                }
              </p>
              
              <div className="mt-6 space-y-2">
                <h3 className="font-bold uppercase tracking-wide text-sm text-gray-500">
                  {isPaid ? 'Anleitung für den Beschenkten:' : 'Anleitung zur Aktivierung:'}
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-base">
                  {isPaid ? (
                    <>
                      <li>Karte ausschneiden und falten (siehe unten).</li>
                      <li>Im Geschäft vorzeigen und mit dem QR-Code bezahlen.</li>
                      <li>Der Restwert bleibt auf der Karte gespeichert.</li>
                      <li>Viel Freude beim Schenken!</li>
                    </>
                  ) : (
                    <>
                      <li>Scannen Sie den QR-Code auf der oberen Kartenhälfte mit Ihrem Smartphone.</li>
                      <li>Sie werden zur sicheren Bezahlseite weitergeleitet.</li>
                      <li>Nach erfolgreicher Zahlung ist der Gutschein <strong>sofort gültig</strong>.</li>
                      <li>Sie können die Karte dann ausschneiden, falten und verschenken.</li>
                    </>
                  )}
                </ol>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                <span>Angebot: {offer.title}</span>
                <span>Referenz: {card.code}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Zum Ausschneiden: Schneiden Sie das Blatt entlang der gestrichelten Linie in der Mitte durch.</p>
          <p>Zum Falten: Falten Sie die obere Hälfte in der Mitte, sodass das Logo vorne und der Code hinten ist.</p>
        </div>
      </div>

      {/* Print Instructions Overlay (Hidden when printing) */}
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center print:hidden">
         <div className="bg-white p-8 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Druckvorschau wird geladen...</h2>
            <p className="mb-6 text-gray-600">Bitte drucken Sie diese Seite auf A4-Papier aus (Hochformat). Deaktivieren Sie &quot;Kopf- und Fußzeilen&quot; in den Druckeinstellungen für das beste Ergebnis.</p>
            <p className="text-xs text-gray-400 animate-pulse">Der Druckdialog öffnet sich automatisch...</p>
         </div>
      </div>
    </div>
  )
}
