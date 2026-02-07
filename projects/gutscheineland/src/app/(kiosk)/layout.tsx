import type { Metadata } from 'next'
import { cn } from '@/utilities/ui'
import { Nunito, Roboto } from 'next/font/google'
import React from 'react'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import '../(frontend)/globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { Toaster } from 'sonner'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
})

export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  // We can keep providers for Auth/Theme
  return (
    <html className={cn(nunito.variable, roboto.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" /> 
      </head>
      <body className="kiosk-mode bg-background text-foreground h-screen overflow-hidden">
        <Providers>
          {/* No Header, No Footer, No AdminBar */}
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'Kiosk App | Gutscheineland',
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  robots: 'noindex, nofollow', // Ensure Kiosk is not indexed
}
