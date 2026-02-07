import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { AccessFields } from '@/fields/access/access'
import type { CollectionConfig } from 'payload'
import { CompaniesSlug, InvoicesSlug } from '@/slugs'

export const Invoices: CollectionConfig = {
  slug: InvoicesSlug,
  labels: {
    singular: {
      en: 'Invoice',
      de: 'Rechnung',
    },
    plural: {
      en: 'Invoices',
      de: 'Rechnungen',
    },
  },
  access: {
    create: () => false, // Only created via backend service
    read: getAccess(['admin', 'owned'], 'read'),
    update: getAccess(['admin'], 'update'),
    delete: getAccess(['admin'], 'delete'),
  },
  admin: {
    group: {
      en: 'Voucher System',
      de: 'Gutschein System',
    },
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'company', 'totalAmount', 'status', 'periodEnd'],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      required: true,
      unique: true,
      label: {
        en: 'Invoice Number',
        de: 'Rechnungsnummer',
      },
      admin: {
        description: {
          en: 'Invoice number (internal or external)',
          de: 'Rechnungsnummer (intern oder extern)',
        },
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: CompaniesSlug,
      label: {
        en: 'Company',
        de: 'Unternehmen',
      },
      required: true,
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      label: {
        en: 'Total Amount (Fees)',
        de: 'Gesamtbetrag (Gebühren)',
      },
      admin: {
        description: {
          en: 'Total fees in Euro',
          de: 'Summe der Gebühren in Euro',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      label: {
        en: 'Status',
        de: 'Status',
      },
      options: [
        {
          label: {
            en: 'Draft',
            de: 'Entwurf',
          },
          value: 'draft',
        },
        {
          label: {
            en: 'Synced',
            de: 'Synchronisiert',
          },
          value: 'synced',
        },
        {
          label: {
            en: 'Paid',
            de: 'Bezahlt',
          },
          value: 'paid',
        },
        {
          label: {
            en: 'Void',
            de: 'Storniert',
          },
          value: 'void',
        },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'transactionCount',
      type: 'number',
      label: {
        en: 'Transaction Count',
        de: 'Anzahl Transaktionen',
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'periodStart',
      type: 'date',
      label: {
        en: 'Period Start',
        de: 'Zeitraum Start',
      },
    },
    {
      name: 'periodEnd',
      type: 'date',
      label: {
        en: 'Period End',
        de: 'Zeitraum Ende',
      },
    },
    {
      name: 'details',
      type: 'json',
      label: {
        en: 'Details',
        de: 'Details',
      },
      admin: {
        description: {
          en: 'Technical details of billed transactions (IDs)',
          de: 'Technische Details der abgerechneten Transaktionen (IDs)',
        },
      },
    },
    ...AccessFields,
  ],
}
