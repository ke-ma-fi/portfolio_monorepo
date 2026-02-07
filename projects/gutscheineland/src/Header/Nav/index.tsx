'use client'

import React, { useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, Menu, X } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen((prev) => !prev)
  const closeMenu = () => setIsOpen(false)



  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-8 items-center">
        {navItems.map(({ link }, i) => {
          return (
            <CMSLink
              key={i}
              {...link}
              appearance="inline"
              className="text-sm font-medium hover:text-primary transition-colors"
            />
          )
        })}
        <Link href="/shops" className="text-sm font-medium hover:text-primary transition-colors">
          Shops
        </Link>
        <Link href="/recover" className="text-sm font-medium hover:text-primary transition-colors">
          Deine Gutscheine
        </Link>
        <Link href="/search">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5 text-primary" />
        </Link>
      </nav>

      {/* Mobile Navigation Toggle */}
      <button
        type="button"
        className="md:hidden p-2 -mr-2 hover:text-primary transition-colors"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-x-0 bottom-0 top-[var(--header-height)] bg-background/95 backdrop-blur-md z-40 md:hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full container py-8 overflow-y-auto">
          <nav className="flex flex-col gap-4">
            {navItems.map(({ link }, i) => {
              return (
                <div 
                  key={i} 
                  className={`transform transition-all duration-500 delay-[${100 + i * 50}ms] ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                >
                  <CMSLink
                    {...link}
                    appearance="inline"
                    className="text-2xl font-bold tracking-tight hover:text-primary transition-colors block"
                    onClick={closeMenu}
                  />
                </div>
              )
            })}
            
            <div className={`transform transition-all duration-500 delay-[${100 + navItems.length * 50}ms] ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Link
                href="/shops"
                className="text-2xl font-bold tracking-tight hover:text-primary transition-colors block"
                onClick={closeMenu}
              >
                Shops
              </Link>
            </div>

            <div className={`transform transition-all duration-500 delay-[${150 + navItems.length * 50}ms] ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Link
                href="/recover"
                className="text-2xl font-bold tracking-tight hover:text-primary transition-colors block"
                onClick={closeMenu}
              >
                Deine Gutscheine
              </Link>
            </div>

            <div className={`mt-6 pt-6 border-t border-border transform transition-all duration-500 delay-[${200 + navItems.length * 50}ms] ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Link
                href="/search"
                className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                <SearchIcon className="w-5 h-5" />
                <span>Suche</span>
              </Link>
            </div>

            <div className={`w-full mt-auto transform transition-all duration-500 delay-[${250 + navItems.length * 50}ms] ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
               {/* Optional footer content for menu could go here */}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
