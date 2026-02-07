'use client'
import React, { useEffect, useState } from 'react'
import api from '@/utilities/clientApi'
import { useAuth } from '@payloadcms/ui'
import type { PaymentTransaction } from '@/payload-types'

export const CompanyMetrics = () => {
  const { user } = useAuth()
  const [revenue, setRevenue] = useState<number | null>(null)
  const [activeCards, setActiveCards] = useState<number | null>(null)

  useEffect(() => {
    if (user?.role !== 'company' || !user?.id) return

    const fetchData = async () => {
      // Fetch Transactions for Revenue (Succeeded only)
      try {
        const transactionsQuery = `?where[and][0][ownedBy][equals]=${user.id}&where[and][1][status][equals]=succeeded&limit=10000`
        console.log('Fetching revenue with query:', transactionsQuery)
        const { data: { docs: transactions, totalDocs } } = await api.get(`/payment-transactions${transactionsQuery}`)
        console.log(`Found ${totalDocs} transactions for revenue calculation.`)
        
        const totalRevenue = transactions.reduce((sum: number, tx: PaymentTransaction) => sum + (tx.netAmount || 0), 0)
        setRevenue(totalRevenue)
      } catch (e) {
        console.error('Error fetching revenue', e)
      }

      // Fetch Active Gift Cards
      try {
        const activeCardsQuery = `?where[and][0][ownedBy][equals]=${user.id}&where[and][1][status][equals]=active&limit=0`
        console.log('Fetching active cards with query:', activeCardsQuery)
        const { data: { totalDocs } } = await api.get(`/gift-cards${activeCardsQuery}`)
        console.log(`Found ${totalDocs} active cards.`)
        setActiveCards(totalDocs)
      } catch (e) {
        console.error('Error fetching active cards', e)
      }
    }
    fetchData()
  }, [user])

  if (!user) return null

  // Links to filtered admin views
  const revenueLink = `/admin/collections/payment-transactions?where[and][0][ownedBy][equals]=${user.id}&where[and][1][status][equals]=succeeded`
  const activeCardsLink = `/admin/collections/gift-cards?where[and][0][ownedBy][equals]=${user.id}&where[and][1][status][equals]=active`

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem' }}>Deine Übersicht</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        {/* Revenue Card */}
        <a href={revenueLink} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'var(--theme-elevation-100)', 
            borderRadius: '12px', 
            border: '1px solid var(--theme-elevation-200)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
          }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--theme-elevation-800)' }}>Gesamtumsatz (Netto)</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--theme-success-500)' }}>
              {revenue !== null ? 
                new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(revenue) 
                : '...'}
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: 'var(--theme-elevation-600)' }}>
              Verkaufte Gutscheine (Klicken für Details)
            </p>
          </div>
        </a>

        {/* Active Cards Card */}
        <a href={activeCardsLink} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'var(--theme-elevation-100)', 
            borderRadius: '12px', 
            border: '1px solid var(--theme-elevation-200)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
          }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--theme-elevation-800)' }}>Aktive Gutscheine</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--theme-primary-500)' }}>
              {activeCards !== null ? activeCards : '...'}
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: 'var(--theme-elevation-600)' }}>
              Gutscheine im Umlauf (Klicken für Details)
            </p>
          </div>
        </a>

      </div>
    </div>
  )
}
