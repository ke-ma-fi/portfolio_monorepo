import type { Field } from 'payload'

export const UserComponents: Field[] = [
  {
    type: 'group',
    admin: {
      condition: (data, siblingData, { user }) => {
        if (user?.role === 'company') {
          return true
        }
        return false
      },
    },
    fields: [
      {
        name: 'ConnectedStripeAccountStatus',
        label: 'Dein Stripe Connect Status',
        type: 'ui',
        admin: {
          components: {
            Field: '@/components/CustomUi/ClientConnectedStripeAccount',
          },
        },
      },
    ],
  },
]
