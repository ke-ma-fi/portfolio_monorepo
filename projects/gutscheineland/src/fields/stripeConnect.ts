import { getAccess } from '@/access/accessSystem'
import type { Field, FieldAccess } from 'payload'

const sharedAccess = {
  read: getAccess(['admin', 'self'], 'read') as FieldAccess,
  update: getAccess(['admin'], 'update') as FieldAccess,
}

export const StripeConnectFields: Field[] = [
  {
    type: 'group',
    label: 'Stripe Connect',
    admin: {
      description:
        'Hier kannst du deine wichtigesten Stripe Connect Daten einsehen. Zum Verwalten klicke den Button und nehme die Verwaltung im Stripe Dashboard vor.',
      condition: (data, siblingData, { user: _user }) => {
        return siblingData && siblingData.role === 'company'
      },
    },
    access: sharedAccess,
    fields: [
      {
        name: 'connectedAccountId',
        type: 'text',
        label: 'Stripe Connected Account ID',
        index: true,
        access: sharedAccess,
      },
      {
        name: 'chargesEnabled',
        type: 'checkbox',
        access: sharedAccess,
      },
      {
        name: 'payoutsEnabled',
        type: 'checkbox',
        access: sharedAccess,
      },
      {
        name: 'detailsSubmitted',
        type: 'checkbox',
        access: sharedAccess,
      },
      {
        name: 'onboardingComplete',
        type: 'checkbox',
        access: sharedAccess,
      },
    ],
  },
]
