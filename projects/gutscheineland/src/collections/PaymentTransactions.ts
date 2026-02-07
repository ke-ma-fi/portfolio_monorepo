import { AccessFields } from '@/fields/access/access'
import { getAccess } from '@/access/accessSystem'
import type { CollectionConfig } from 'payload'
import {
  CompaniesSlug,
  CustomersSlug,
  GiftCardsSlug,
  InvoicesSlug,
  PaymentTransactionsSlug,
} from '@/slugs'

export const PaymentTransactions: CollectionConfig = {
  slug: PaymentTransactionsSlug,
  labels: {
    singular: {
      en: 'Payment Transaction',
      de: 'Zahlungstransaktion',
    },
    plural: {
      en: 'Payment Transactions',
      de: 'Zahlungstransaktionen',
    },
  },
  access: {
    create: () => false, // Created via system/webhooks
    read: getAccess(['admin', 'owned'], 'read'),
    update: () => false, // Immutable financial records
    delete: () => false, // Immutable
  },
  admin: {
    group: {
      en: 'Finance',
      de: 'Finanzen',
    },
    defaultColumns: ['transactionType', 'amount', 'status', 'company', 'createdAt'],
  },
  timestamps: true,
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: {
        en: 'Amount (€)',
        de: 'Betrag (€)',
      },
      admin: {
        description: {
          en: 'Total paid amount',
          de: 'Gesamt gezahlter Betrag',
        },
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'EUR',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'transactionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Online Purchase (Stripe)', value: 'online_purchase' },
        { label: 'In-Store Purchase', value: 'instore_purchase' },
        { label: 'Refund', value: 'refund' },
      ],
      label: {
        en: 'Type',
        de: 'Typ',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'succeeded',
      options: [
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'paymentProvider',
      type: 'select',
      required: true,
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'Point of Sale (POS)', value: 'pos' },
        { label: 'Cash', value: 'cash' },
        { label: 'Manual/Other', value: 'manual' },
      ],
      label: {
        en: 'Payment Provider',
        de: 'Zahlungsanbieter',
      },
    },
    // Stripe specific
    {
      name: 'stripeSessionId',
      type: 'text',
      label: 'Stripe Session ID',
      admin: {
        condition: (_, siblingData) => siblingData?.paymentProvider === 'stripe',
        readOnly: true,
      },
      index: true,
      unique: true,
    },
    // Fees & Settlements
    {
      name: 'platformFee',
      type: 'number',
      label: {
        en: 'Platform Fee (€)',
        de: 'Plattformgebühr (€)',
      },
      admin: {
        description: {
          en: 'Commission retained by platform',
          de: 'Einbehaltene Provision',
        },
      },
    },
    {
      name: 'netAmount',
      type: 'number',
      label: {
        en: 'Net Amount (€)',
        de: 'Nettobetrag (€)',
      },
      admin: {
        description: {
          en: 'Payout to merchant',
          de: 'Auszahlung an Händler',
        },
      },
    },
    {
      name: 'feeStatus',
      type: 'select',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Paid via Stripe', value: 'paid_via_stripe' },
        { label: 'Invoiced', value: 'invoiced' },
        { label: 'Waived', value: 'waived' },
        { label: 'Not Applicable', value: 'not_applicable' },
      ],
      defaultValue: 'open',
    },
    {
      name: 'invoice',
      type: 'relationship',
      relationTo: InvoicesSlug,
      label: {
        en: 'Invoice',
        de: 'Rechnung',
      },
    },
    // Relations
    {
      name: 'relatedGiftCard',
      type: 'relationship',
      relationTo: GiftCardsSlug,
      hasMany: false, // Typically one payment = one card (or reload).
      label: {
        en: 'Related Gift Card',
        de: 'Zugehöriger Gutschein',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: CustomersSlug,
      label: {
        en: 'Buyer',
        de: 'Käufer',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: CompaniesSlug,
      required: true,
      label: {
        en: 'Company',
        de: 'Unternehmen',
      },
      index: true,
    },
    ...AccessFields, // Adds ownedBy for RBAC
  ],
}
