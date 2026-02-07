'use client'
import React, { useState } from 'react'
import api from '@/utilities/clientApi'
import { Button } from '@payloadcms/ui'
import { useAuth } from '@payloadcms/ui'
import type {} from 'payload'

const StripeStatus = () => {
  const { user } = useAuth()
  const [accountCreatePending, setAccountCreatePending] = useState(false)
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false)
  const [error, setError] = useState(false)
  const [connectedAccountId, setConnectedAccountId] = useState<string>(
    user?.connectedAccountId || '',
  )

  const onboardingComplete = user?.onboardingComplete || false

  return (
    <div className="container">
      <div>
        <h2> Stripe Verbinungsstatus</h2>
        <br />
      </div>
      <div className="content">
        {onboardingComplete && !error && (
          <div>
            <p className="success">
              ✅ Dein Stripe-Konto ist eingerichtet und bereit, Zahlungen zu akzeptieren!
            </p>
            <Button
              className="mb-2"
              onClick={async () => {
                try {
                  const response = await api.post('/stripe/get-login-link')
                  const { url, error } = response.data
                  if (error) {
                    setError(true)
                  }
                  if (!url) {
                    setError(true)
                  }
                  setError(false)
                  window.open(url, '_blank', 'noopener,noreferrer')
                } catch (_err) {
                  setError(true)
                }
              }}
            >
              Zum Stripe Dashboard
            </Button>
          </div>
        )}
        {!connectedAccountId && <h4>Eröffne deinen Store jetzt auch im Gutscheineland!</h4>}
        {!connectedAccountId && (
          <p>
            Gutscheineland ist die führende Plattform für Geschenkgutscheine: Verbinde dein
            Gutscheineland Business-Account mit Stripe, um Zahlungen zu akzeptieren.
          </p>
        )}
        {connectedAccountId && !onboardingComplete && (
          <h5>
            ‼️ Fast geschafft! Du bist bereits bei Stripe gemeldet. Bitte beende die Einrichtung
            deines Stripe-Kontos. Die Einrichtung dauert nur wenige Minuten und ist kostenlos.
          </h5>
        )}
        {connectedAccountId && !error && (
          <p>
            {' '}
            Gutscheineland arbeitet mit Stripe zusammen, um dir zu helfen, Zahlungen zu erhalten,
            während deine persönlichen und Bankdaten sicher bleiben.
          </p>
        )}
        {!accountCreatePending && !connectedAccountId && (
          <Button
            onClick={async () => {
              setAccountCreatePending(true)
              setError(false)
              try {
                const response = await api.post('/stripe/create-connected-account')
                setAccountCreatePending(false)

                const { account, error } = response.data

                if (account) {
                  setConnectedAccountId(account)
                }

                if (error) {
                  setError(true)
                }
              } catch (_err) {
                setAccountCreatePending(false)
                setError(true)
              }
            }}
          >
            Stripe-Konto erstellen!
          </Button>
        )}
        {connectedAccountId && !accountLinkCreatePending && !onboardingComplete && (
          <Button
            onClick={async () => {
              setAccountLinkCreatePending(true)
              setError(false)
              try {
                const response = await api.post('/stripe/create-onboarding-link', {
                  account: connectedAccountId,
                })
                setAccountLinkCreatePending(false)

                const { url, error } = response.data
                if (url) {
                  window.location.href = url
                }

                if (error) {
                  setError(true)
                }
              } catch (_err) {
                setAccountLinkCreatePending(false)
                setError(true)
              }
            }}
          >
            Einrichtung abschließen!
          </Button>
        )}
        {error && (
          <p className="error">
            ❌ Hier ist etwas schief gelaufen. Bitte versuche es nochmal oder kontaktiere den
            Support!
          </p>
        )}
        {(connectedAccountId || accountCreatePending || accountLinkCreatePending) &&
          !onboardingComplete && (
            <div className="dev-callout">
              {connectedAccountId && (
                <p>
                  Deine verbundene Kontonummer ist:{' '}
                  <code className="bold">{connectedAccountId}</code>
                </p>
              )}
              {accountCreatePending && <p>Erstelle ein verbundenes Konto...</p>}
              {accountLinkCreatePending && <p>Erstelle einen neuen Kontolink...</p>}
            </div>
          )}
      </div>
    </div>
  )
}

export default StripeStatus
