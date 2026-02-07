import { isVisible } from '@/access/visibility'
import { AccessFields } from '@/fields/access/access'
import { getAccess } from '@/access/accessSystem'
import type { CollectionConfig } from 'payload'
import { CompaniesSlug, GiftCardsSlug, GiftCardTransactionsSlug } from '@/slugs'

/**
 * Gift Card Transactions (Ledger)
 * 
 * Represents an immutable ledger of all value changes to gift cards.
 * This collection provides a complete audit trail for balance history.
 * - Created automatically via hooks/services
 * - Read-only for admins and owners
 * - Cannot be updated or deleted to ensure data integrity
 */
export const GiftCardTransactions: CollectionConfig = {
  slug: GiftCardTransactionsSlug,
  labels: {
    singular: {
      en: 'Ledger Entry',
      de: 'Buchungssatz',
    },
    plural: {
      en: 'Ledger Entries',
      de: 'Buchungssätze',
    },
  },
  access: {
    create: () => false,
    read: getAccess(['admin', 'owned'], 'read'),
    update: () => false, // Ledger is immutable
    delete: () => false,
  },
  admin: {
    group: {
      en: 'Voucher System',
      de: 'Gutschein System',
    },
    hidden: isVisible(['admin', 'company']),
    useAsTitle: 'id',
    defaultColumns: ['giftcard', 'transactionType', 'amount', 'balanceAfter', 'createdAt'],
  },
  versions: true, // Keep versioning for audit
  timestamps: true,
  fields: [
    {
      name: 'giftcard',
      type: 'relationship',
      relationTo: GiftCardsSlug,
      required: true,
      label: {
        en: 'Gift Card',
        de: 'Gutschein',
      },
    },
    {
      name: 'transactionType',
      type: 'select',
      label: {
        en: 'Transaction Type',
        de: 'Transaktionstyp',
      },
      options: [
        {
          label: {
            en: 'Initial Credit',
            de: 'Erstgutschrift',
          },
          value: 'initial_credit',
        },
        {
          label: {
            en: 'Redemption',
            de: 'Einlösung',
          },
          value: 'redemption',
        },
        {
          label: {
            en: 'Correction',
            de: 'Korrektur',
          },
          value: 'correction',
        },
        {
          label: {
            en: 'Void',
            de: 'Stornierung',
          },
          value: 'void',
        },
      ],
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: {
        en: 'Change Amount',
        de: 'Änderungsbetrag',
      },
      admin: {
        description: {
          en: 'Absolute amount of change (direction from transaction type)',
          de: 'Absoluter Änderungsbetrag (Richtung über Transaktionstyp)',
        },
      },
    },
    {
      name: 'balanceAfter',
      type: 'number',
      required: true,
      label: {
        en: 'Balance After',
        de: 'Restguthaben',
      },
      admin: {
        description: {
          en: 'Remaining Balance Snapshot',
          de: 'Restguthaben Momentaufnahme',
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
      admin: {
        description: {
          en: 'Associated Company',
          de: 'Zugehöriges Unternehmen',
        },
      },
      index: true,
    },
    ...AccessFields,
  ],
}
