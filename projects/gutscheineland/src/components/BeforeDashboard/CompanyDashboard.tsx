'use client'
import React from 'react'
import { useAuth } from '@payloadcms/ui'
import StripeStatus from '@/components/CustomUi/ClientConnectedStripeAccount'
import { CompanyMetrics } from './CompanyMetrics'

const CompanyDashboard = () => {
  const { user } = useAuth()

  if (user?.role !== 'company') {
    return null
  }

  return (
    <div className="gutter--left gutter--right" style={{ marginTop: '2rem' }}>
      {/* Quick Launch Kiosk */}
      <div style={{ marginBottom: '2rem' }}>
        <a 
          href="/kiosk" 
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: 'var(--theme-success-500)', // Use Payload theme color or primary
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="10" height="6" x="7" y="9" rx="2"/></svg>
          Kiosk App Starten (In-Store)
        </a>
      </div>

      <CompanyMetrics />
      
      <div style={{ 
        marginTop: '3rem', 
        borderTop: '1px solid var(--theme-elevation-200)', 
        paddingTop: '2rem',
        paddingBottom: '2rem'
      }}>
        <div style={{
          padding: '2rem',
          backgroundColor: 'var(--theme-elevation-100)', 
          borderRadius: '12px', 
          border: '1px solid var(--theme-elevation-200)',
        }}>
           <StripeStatus />
        </div>
      </div>
    </div>
  )
}

export default CompanyDashboard
