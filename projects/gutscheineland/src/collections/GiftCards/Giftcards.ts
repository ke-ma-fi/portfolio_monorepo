import type { CollectionConfig } from 'payload'
import { generateUniqueCode } from '@/collections/GiftCards/hooks/generateUniqueCode'
import { initializeRemainingBalance } from '@/collections/GiftCards/hooks/initializeBalance'
import { calculateExpiryDate } from '@/collections/GiftCards/hooks/calculateExpiryDate'
import { handleActivation } from '@/collections/GiftCards/hooks/handleActivation'
import { generateUUID } from '@/collections/GiftCards/hooks/generateUUID'
import { populateFromOffer } from '@/collections/GiftCards/hooks/populateFromOffer'
import { AccessFields } from '@/fields/access/access'
import { getAccess } from '@/access/accessSystem'
import { handleResetToBuyer } from '@/collections/GiftCards/hooks/handleResetToBuyer'

import { recordLedgerEntry } from '@/collections/GiftCards/hooks/recordLedgerEntry'
import { CompaniesSlug, CustomersSlug, GiftCardOffersSlug, GiftCardsSlug, PaymentTransactionsSlug } from '@/slugs'

/**
 * Gift Cards Collection
 * 
 * Core collection managing the lifecycle of digital gift cards.
 * Handles creation, activation, balance tracking, and expiration.
 * Relies heavily on hooks to automate business logic and ensure data consistency.
 */
export const GiftCards: CollectionConfig = {
  slug: GiftCardsSlug,
  labels: {
    singular: {
      en: 'Gift Card',
      de: 'Gutschein',
    },
    plural: {
      en: 'Gift Cards',
      de: 'Gutscheine',
    },
  },
  access: {
    // Guest access is handled via the "uuid" field logic in endpoints/frontend, not here.
    // Standard Payload access remains for Admin/Company management.
    create: getAccess(['admin'], 'create'),
    read: getAccess(['admin', 'owned'], 'read'),
    update: getAccess(['admin'], 'update'),
    delete: getAccess(['admin'], 'delete'),
  },
  admin: {
    group: {
      en: 'Voucher System',
      de: 'Gutschein System',
    },
    useAsTitle: 'code',
    defaultColumns: ['code', 'status', 'remainingBalance', 'customerEmail', 'expiryDate'],
  },
  versions: true,
  timestamps: true,
  trash: true,
  hooks: {
    beforeChange: [
      // Sequence of operations for new/updated cards:
      generateUUID, // 1. Ensure security tokens exist
      populateFromOffer, // 2. Copy value/price from selected offer
      generateUniqueCode, // 3. Generate readable 8-digit code
      initializeRemainingBalance, // 4. Set initial balance matching value
      handleActivation, // 5. Check if status changed to active -> set activation date
      calculateExpiryDate, // 6. Set expiry based on legal requirements/settings
      handleResetToBuyer, // 7. Admin utility to reset ownership
    ],
    afterChange: [
      recordLedgerEntry, // 8. Log the change in the Transaction ledger
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            en: 'Overview',
            de: 'Übersicht',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'code',
                  type: 'text',
                  index: true,
                  unique: true,
                  label: {
                    en: 'Code',
                    de: 'Code',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'Unique 8-digit code (XXXX-XXXX)',
                      de: 'Eindeutiger 8-stelliger Code (XXXX-XXXX)',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'customerEmail',
                  type: 'email',
                  required: true,
                  index: true,
                  label: {
                    en: 'Customer Email',
                    de: 'Käufer E-Mail',
                  },
                  admin: {
                    description: {
                      en: 'Buyer email (for recovery)',
                      de: 'Email des Käufers (für Wiederherstellung)',
                    },
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'offer',
                  type: 'relationship',
                  relationTo: GiftCardOffersSlug,
                  required: true,
                  label: {
                    en: 'Offer',
                    de: 'Angebot',
                  },
                  admin: {
                    description: {
                      en: 'Gift card offer',
                      de: 'Gutschein-Angebot',
                    },
                    width: '50%',
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
                      en: 'Issuing company',
                      de: 'Ausstellendes Unternehmen',
                    },
                    readOnly: true,
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'buyer',
                  type: 'relationship',
                  relationTo: CustomersSlug,
                  label: {
                    en: 'Buyer',
                    de: 'Käufer',
                  },
                  admin: {
                    description: {
                      en: 'Link to CRM record (Buyer)',
                      de: 'Link zum CRM Datensatz (Käufer)',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'payments',
                  type: 'join',
                  collection: PaymentTransactionsSlug,
                  on: 'relatedGiftCard',
                  label: {
                     en: 'Payments',
                     de: 'Zahlungen',
                  },
                  admin: {
                    position: 'sidebar',
                    description: {
                        en: 'Linked Payment Transactions',
                        de: 'Verknüpfte Zahlungstransaktionen'
                    }
                  }
                }
              ],
            },
          ],
        },
        {
          label: {
            en: 'Status & Value',
            de: 'Status & Wert',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  index: true,
                  label: {
                    en: 'Status',
                    de: 'Status',
                  },
                  options: [
                    {
                      label: {
                        en: 'Inactive (unpaid)',
                        de: 'Inaktiv (unbezahlt)',
                      },
                      value: 'inactive',
                    },
                    {
                      label: {
                        en: 'Active (paid & ready)',
                        de: 'Aktiv (bezahlt & bereit)',
                      },
                      value: 'active',
                    },
                    {
                      label: {
                        en: 'Redeemed',
                        de: 'Eingelöst',
                      },
                      value: 'redeemed',
                    },
                    {
                      label: {
                        en: 'Expired',
                        de: 'Abgelaufen',
                      },
                      value: 'expired',
                    },
                  ],
                  defaultValue: 'inactive',
                  admin: {
                    description: {
                      en: 'Current card status',
                      de: 'Aktueller Kartenstatus',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'isPaid',
                  type: 'checkbox',
                  defaultValue: false,
                  label: {
                    en: 'Is Paid?',
                    de: 'Ist bezahlt?',
                  },
                  admin: {
                    description: {
                      en: 'Has the card been paid for?',
                      de: 'Wurde die Karte bezahlt?',
                    },
                    width: '50%',
                    style: { marginTop: '35px' },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'giftedAt',
                  type: 'date',
                  label: {
                    en: 'Gifted At',
                    de: 'Verschenkt am',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'When was the card sent?',
                      de: 'Wann wurde die Karte versendet?',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'printedAt',
                  type: 'date',
                  label: {
                    en: 'Printed At',
                    de: 'Gedruckt am',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'When was the card printed?',
                      de: 'Wann wurde die Karte gedruckt?',
                    },
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'originalValue',
                  type: 'number',
                  label: {
                    en: 'Original Value',
                    de: 'Ursprünglicher Wert',
                  },
                  admin: {
                    description: {
                      en: 'Original value (€)',
                      de: 'Ursprünglicher Wert (€)',
                    },
                    readOnly: true,
                    width: '50%',
                  },
                },
                {
                  name: 'remainingBalance',
                  type: 'number',
                  label: {
                    en: 'Remaining Balance',
                    de: 'Restguthaben',
                  },
                  admin: {
                    description: {
                      en: 'Remaining amount (€)',
                      de: 'Verbleibender Betrag (€)',
                    },
                    readOnly: true,
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'activationDate',
                  type: 'date',
                  label: {
                    en: 'Activation Date',
                    de: 'Aktivierungsdatum',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'Date of activation',
                      de: 'Aktivierungsdatum',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'expiryDate',
                  type: 'date',
                  label: {
                    en: 'Expiry Date',
                    de: 'Ablaufdatum',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'Date of expiration',
                      de: 'Ablaufdatum',
                    },
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Gifting',
            de: 'Verschenken',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'recipientName',
                  type: 'text',
                  label: {
                    en: 'Recipient Name',
                    de: 'Name des Beschenkten',
                  },
                  admin: {
                    description: {
                      en: 'Name of the recipient',
                      de: 'Name des Beschenkten',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'recipientEmail',
                  type: 'email',
                  index: true,
                  label: {
                    en: 'Recipient Email',
                    de: 'E-Mail des Beschenkten',
                  },
                  admin: {
                    description: {
                      en: 'Email of the recipient',
                      de: 'E-Mail des Beschenkten',
                    },
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'message',
              type: 'textarea',
              label: {
                en: 'Message',
                de: 'Nachricht',
              },
              admin: {
                description: {
                  en: 'Personal message from the buyer',
                  de: 'Persönliche Nachricht des Käufers',
                },
                condition: (data) => data.recipientEmail,
              },
            },
          ],
        },
        {
          label: {
            en: 'System & Access',
            de: 'System & Zugang',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'uuid',
                  type: 'text',
                  unique: true,
                  index: true,
                  label: {
                    en: 'Buyer Access Token',
                    de: 'Käufer Access Token',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'Buyer Access Token (Management Link)',
                      de: 'Käufer Access Token (Verwaltungs-Link)',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'recipientUuid',
                  type: 'text',
                  unique: true,
                  index: true,
                  label: {
                    en: 'Recipient Access Token',
                    de: 'Empfänger Access Token',
                  },
                  admin: {
                    readOnly: true,
                    description: {
                      en: 'Recipient Access Token (Redemption Link)',
                      de: 'Empfänger Access Token (Einlöse-Link)',
                    },
                    width: '50%',
                  },
                },
              ],
            },

            {
              name: 'lockVersion',
              type: 'number',
              defaultValue: 0,
              label: {
                en: 'Lock Version',
                de: 'Sperrversion',
              },
              admin: {
                readOnly: true,
                description: {
                  en: 'Optimistic Locking Version (prevents race conditions)',
                  de: 'Optimistic Locking Version (verhindert Race Conditions)',
                },
                position: 'sidebar',
              },
            },
            ...AccessFields,
            {
              name: 'resetToBuyer',
              type: 'checkbox',
              label: {
                en: 'Reset to Buyer (Admin)',
                de: 'Karte zurücksetzen (Admin)',
              },
              admin: {
                description: {
                  en: 'If checked, all recipient data will be cleared and new codes generated (Card belongs to buyer again).',
                  de: 'Wenn aktiviert, werden alle Empfängerdaten gelöscht und neue Codes generiert (Karte gehört wieder dem Käufer).',
                },
                position: 'sidebar',
              },
            },
          ],
        },
      ],
    },
  ],
}