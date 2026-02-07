import type { CollectionConfig } from 'payload'
import { ActivatableField } from '@/fields/activatable'
import { TaggableField } from '@/fields/taggable'
import { AccessFields } from '@/fields/access/access'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { CompaniesSlug, GiftCardOffersSlug, MediaSlug } from '@/slugs'

export const GiftCardOffers: CollectionConfig = {
  slug: GiftCardOffersSlug,
  labels: {
    singular: {
      en: 'Gift Card Offer',
      de: 'Gutscheinangebot',
    },
    plural: {
      en: 'Gift Card Offers',
      de: 'Gutscheinangebote',
    },
  },
  access: {
    create: getAccess(['admin', 'company'], 'create'),
    read: getAccess(['admin', 'owned', 'published'], 'read'),
    update: getAccess(['admin', 'owned'], 'update'),
    delete: getAccess(['admin'], 'delete'),
  },
  admin: {
    group: {
      en: 'Voucher System',
      de: 'Gutschein System',
    },
    hidden: isVisible(['admin', 'company']),
    useAsTitle: 'title',
    defaultColumns: ['title', 'business', 'value', 'isActive'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            en: 'Offer',
            de: 'Angebot',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: {
                    en: 'Title',
                    de: 'Titel',
                  },
                  admin: { width: '50%' },
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
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              label: {
                en: 'Description',
                de: 'Beschreibung',
              },
              required: true,
            },
            {
              name: 'cardImage',
              type: 'upload',
              relationTo: MediaSlug,
              label: {
                en: 'Card Design (Image)',
                de: 'Kartendesign (Bild)',
              },
              admin: {
                description: {
                  en: 'Design for the card (Background Image). Recommended: 1200x675px (16:9)',
                  de: 'Design für die Karte (Hintergrundbild). Empfohlen: 1200x675px (16:9)',
                },
              },
            },
          ],
        },
        {
          label: {
            en: 'Conditions',
            de: 'Konditionen',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'value',
                  type: 'number',
                  required: true,
                  label: {
                    en: 'Value',
                    de: 'Wert',
                  },
                  admin: {
                    description: {
                      en: 'Credit value of the voucher (€)',
                      de: 'Guthaben-Wert des Gutscheins (€)',
                    },
                    width: '50%',
                  },
                },
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  label: {
                    en: 'Price',
                    de: 'Preis',
                  },
                  admin: {
                    description: {
                      en: 'Sale price of the voucher (€)',
                      de: 'Verkaufspreis des Gutscheins (€)',
                    },
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'expiryDurationDays',
              type: 'number',
              required: true,
              defaultValue: 365 * 3,
              label: {
                en: 'Expiry Duration (Days)',
                de: 'Gültigkeitsdauer (Tage)',
              },
              admin: {
                description: {
                  en: 'Validity in days after activation (Default: 3 years)',
                  de: 'Gültigkeit in Tagen nach Aktivierung (Standard: 3 Jahre)',
                },
              },
            },
            {
              type: 'row',
              fields: [
                ActivatableField,
                TaggableField,
              ],
            },
          ],
        },
        {
          label: {
            en: 'System',
            de: 'System',
          },
          fields: [...AccessFields],
        },
      ],
    },
  ],
  hooks: {
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  timestamps: true,
  trash: true,
}
