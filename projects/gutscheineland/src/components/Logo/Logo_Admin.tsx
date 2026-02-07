'use client'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@payloadcms/ui'
import LogoDark from 'public/logo_nav_dark.png'
import LogoLight from 'public/logo_nav_bright.png'

export default function MyLogo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)
  }, [])

  
  const src = !mounted ? LogoDark.src : theme === 'dark' ? LogoDark.src : LogoLight.src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt="Gutscheineland Logo" 
      style={{
        maxWidth: '400px', // Restrict width to avoid huge logos in admin bar
        height: 'auto',
      }}
    /> 
  )
}
