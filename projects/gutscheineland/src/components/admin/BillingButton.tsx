'use client'
import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const BillingButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { id } = useDocumentInfo()
  const companyId = id as string | number | undefined

  // Reset confirmation state after 3 seconds if not clicked
  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [confirming])

  // Only show if we have a saved company ID
  if (!companyId) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirming) {
      setConfirming(true)
      return
    }

    // Doing the actual action
    handleBilling()
  }

  const handleBilling = async () => {
    setLoading(true)
    setConfirming(false) // Reset confirmation state immediately

    try {
      const res = await fetch('/api/billing/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      })

      const json = await res.json()

      if (res.ok) {
        if (json.invoice) {
           alert(`Erfolg! Rechnung ${json.invoice.invoiceNumber} erstellt.`)
           // Optionally reload
           // window.location.reload()
        } else {
           alert(json.message || "Keine offenen Gebühren gefunden.") 
        }
      } else {
         alert(`Fehler: ${json.error || 'Unbekannter Fehler'}`)
      }
    } catch (err) {
      console.error(err)
      alert('Netzwerkfehler beim Rechnungslauf.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="field-type ui-field" style={{ marginBottom: '20px', padding: '10px', border: '1px dashed #ccc', borderRadius: '5px' }}>
      <label className="field-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
        Verwaltung
      </label>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          backgroundColor: confirming ? '#dc2626' : '#333', // Red when confirming, Dark when normal
          color: '#fff',
          padding: '10px 15px',
          borderRadius: '4px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          transition: 'background-color 0.2s',
          minWidth: '180px'
        }}
      >
        {loading 
          ? 'Rechnung wird erstellt...' 
          : confirming 
            ? 'Wirklich starten?' 
            : 'Rechnungslauf starten'}
      </button>
      <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
        {confirming 
          ? 'Klicken Sie erneut, um den Vorgang zu bestätigen.' 
          : 'Erstellt eine Rechnung für alle offenen Gebühren.'}
      </p>
    </div>
  )
}
