'use client'
import React, { useState, useEffect } from 'react'
import logoDark from 'public/logo_nav_dark.png'
import logoLight from 'public/logo_nav_bright.png'
import { useTheme } from '@/providers/Theme'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo: React.FC<Props> = ({ className, loading = 'lazy', priority = 'low' }) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // SSR (mounted=false) → always light
  // Client (mounted=true) → actual theme
  const src = !mounted ? logoLight.src : theme === 'dark' ? logoDark.src : logoLight.src

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Gutscheineland Logo"
      width={250}
      height={100}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={className}
      src={src}
      suppressHydrationWarning
    />
  )
}
