import type { CollectionConfig, FieldAccess } from 'payload'
import { slugField } from '@/fields/slug'
import { ActivatableField } from '@/fields/activatable'
import { TaggableField } from '@/fields/taggable'
import { AccessFields } from '@/fields/access/access'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { stripeBusinessFields } from '@/fields/stripeCompany'
import { syncToUser } from './hooks/syncToUser'
import { CompaniesSlug, MediaSlug } from '@/slugs'

export const Companies: CollectionConfig = {
  slug: CompaniesSlug,
  labels: {
    singular: {
      en: 'Company',
      de: 'Unternehmen',
    },
    plural: {
      en: 'Companies',
      de: 'Unternehmen',
    },
  },
  access: {
    create: getAccess(['admin'], 'create'),
    read: getAccess(['admin', 'owned'], 'read'),
    update: getAccess(['admin', 'owned'], 'update'),
    delete: getAccess(['admin'], 'delete'),
  },
  versions: true,
  timestamps: true,
  trash: true,
  hooks: {
    afterChange: [syncToUser],
  },
  admin: {
    group: {
      en: 'Business',
      de: 'Geschäft',
    },
    hidden: isVisible(['admin', 'company']),
    useAsTitle: 'legalName',
  },
  fields: [
    // Presentational tabs (no database structure changes)
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            en: 'Basic Data',
            de: 'Grunddaten',
          },
          fields: [
            {
              name: 'displayName',
              type: 'text',
              label: {
                en: 'Display Name',
                de: 'Anzeigename',
              },
              admin: {
                description: {
                  en: 'Display name for customers',
                  de: 'Anzeigename für Kunden',
                },
              },
            },
            {
              name: 'description',
              type: 'textarea',
              label: {
                en: 'Description',
                de: 'Beschreibung',
              },
              admin: {
                description: {
                  en: 'Short description of the company for customer presentation',
                  de: 'Kurze Beschreibung des Unternehmens für die Kundenpräsentation',
                },
              },
            },
            {
              name: 'slogan',
              type: 'text',
              label: {
                en: 'Slogan',
                de: 'Slogan',
              },
              admin: {
                description: {
                  en: 'Company slogan or tagline',
                  de: 'Slogan oder Tagline des Unternehmens',
                },
              },
            },
            TaggableField, // tags - Categories and Keywords
            {
              type: 'group',
              label: {
                en: 'Contact Details for Customers',
                de: 'Kontaktdaten für Kunden',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'email',
                      type: 'email',
                      label: {
                        en: 'Email',
                        de: 'E-Mail',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Main email address of the company',
                          de: 'Haupt-E-Mail-Adresse des Unternehmens',
                        },
                      },
                    },
                    {
                      name: 'phone',
                      type: 'text',
                      label: {
                        en: 'Phone',
                        de: 'Telefon',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Main phone number of the company',
                          de: 'Haupt-Telefonnummer des Unternehmens',
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              label: {
                en: 'Location & Address',
                de: 'Standort & Adresse',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'street',
                      type: 'text',
                      label: {
                        en: 'Street',
                        de: 'Straße',
                      },
                      admin: { width: '70%' },
                    },
                    {
                      name: 'houseNumber',
                      type: 'text',
                      label: {
                        en: 'No.',
                        de: 'Nr.',
                      },
                      admin: { width: '30%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'zipCode',
                      type: 'text',
                      label: {
                        en: 'Zip Code',
                        de: 'PLZ',
                      },
                      admin: { width: '30%' },
                    },
                    {
                      name: 'city',
                      type: 'text',
                      label: {
                        en: 'City',
                        de: 'Stadt',
                      },
                      admin: { width: '70%' },
                    },
                  ],
                },
                {
                  name: 'country',
                  type: 'text',
                  label: {
                    en: 'Country',
                    de: 'Land',
                  },
                  defaultValue: 'Deutschland',
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Branding',
            de: 'Branding',
          },
          fields: [
            {
              name: 'logo',
              type: 'upload',
              label: {
                en: 'Logo',
                de: 'Logo',
              },
              relationTo: MediaSlug,
              admin: {
                description: {
                  en: 'Company logo for display. Recommended: 500x500px (Square)',
                  de: 'Firmen-Logo für die Darstellung. Empfohlen: 500x500px (Quadratisch)',
                },
              },
            },
            {
              name: 'headerImage',
              type: 'upload',
              label: {
                en: 'Header Image',
                de: 'Header-Bild',
              },
              relationTo: MediaSlug,
              admin: {
                description: {
                  en: 'Header image for the company page. Recommended: 1920x600px (approx. 3:1)',
                  de: 'Header-Bild für die Unternehmensseite. Empfohlen: 1920x600px (ca. 3:1)',
                },
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'primaryColor',
                  type: 'text',
                  label: {
                    en: 'Primary Color',
                    de: 'Primärfarbe',
                  },
                  admin: {
                    width: '50%',
                    description: {
                      en: 'Primary color as Hex code (e.g. #FF5733)',
                      de: 'Primärfarbe als Hex-Code (z.B. #FF5733)',
                    },
                  },
                },
                {
                  name: 'secondaryColor',
                  type: 'text',
                  label: {
                    en: 'Secondary Color',
                    de: 'Sekundärfarbe',
                  },
                  admin: {
                    width: '50%',
                    description: {
                      en: 'Secondary color as Hex code',
                      de: 'Sekundärfarbe als Hex-Code',
                    },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'website',
                  type: 'text',
                  label: {
                    en: 'Website',
                    de: 'Website',
                  },
                  admin: {
                    width: '50%',
                    description: {
                      en: 'Main company website',
                      de: 'Hauptwebsite des Unternehmens',
                    },
                  },
                },
                {
                  name: 'googleBusinessUrl',
                  type: 'text',
                  label: {
                    en: 'Google Business',
                    de: 'Google Business',
                  },
                  admin: {
                    width: '50%',
                    description: {
                      en: 'Google Business Profile URL',
                      de: 'Google Business Profil URL',
                    },
                  },
                },
              ],
            },
            {
              type: 'group',
              label: {
                en: 'Social Media',
                de: 'Social Media',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'facebookUrl',
                      type: 'text',
                      label: {
                        en: 'Facebook',
                        de: 'Facebook',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Facebook Page URL',
                          de: 'Facebook Seiten-URL',
                        },
                      },
                    },
                    {
                      name: 'instagramUrl',
                      type: 'text',
                      label: {
                        en: 'Instagram',
                        de: 'Instagram',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Instagram Profile URL',
                          de: 'Instagram Profil-URL',
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'linkedinUrl',
                      type: 'text',
                      label: {
                        en: 'LinkedIn',
                        de: 'LinkedIn',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'LinkedIn Company Page',
                          de: 'LinkedIn Unternehmensseite',
                        },
                      },
                    },
                    {
                      name: 'twitterUrl',
                      type: 'text',
                      label: {
                        en: 'Twitter',
                        de: 'Twitter',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Twitter/X Profile URL',
                          de: 'Twitter/X Profil-URL',
                        },
                      },
                    },
                  ],
                },
                {
                  name: 'youtubeUrl',
                  type: 'text',
                  label: {
                    en: 'YouTube',
                    de: 'YouTube',
                  },
                  admin: {
                    description: {
                      en: 'YouTube Channel URL',
                      de: 'YouTube Kanal-URL',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Legal',
            de: 'Rechtliches',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'commercialRegister',
                  type: 'text',
                  label: {
                    en: 'Commercial Register',
                    de: 'Handelsregister',
                  },
                  admin: {
                    width: '50%',
                    description: {
                      en: 'Commercial register number (e.g. HRB 123456)',
                      de: 'Handelsregisternummer (z.B. HRB 123456)',
                    },
                  },
                },
                {
                  name: 'vatId',
                  type: 'text',
                  label: {
                    en: 'VAT ID',
                    de: 'Umsatzsteuer-ID',
                  },
                  admin: {
                    width: '50%',
                    description: {
                      en: 'VAT identification number',
                      de: 'Umsatzsteuer-Identifikationsnummer',
                    },
                  },
                },
              ],
            },
            {
              name: 'managingDirector',
              type: 'text',
              label: {
                en: 'Managing Director',
                de: 'Geschäftsführung',
              },
              admin: {
                description: {
                  en: 'Managing Director / Owner',
                  de: 'Geschäftsführer/Inhaber',
                },
              },
            },
            {
              type: 'group',
              label: {
                en: 'Legal Links',
                de: 'Rechtliche Links',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'imprintUrl',
                      type: 'text',
                      label: {
                        en: 'Imprint',
                        de: 'Impressum',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Link to Imprint',
                          de: 'Link zum Impressum',
                        },
                      },
                    },
                    {
                      name: 'privacyPolicyUrl',
                      type: 'text',
                      label: {
                        en: 'Privacy Policy',
                        de: 'Datenschutz',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Link to Privacy Policy',
                          de: 'Link zur Datenschutzerklärung',
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'termsUrl',
                      type: 'text',
                      label: {
                        en: 'Terms & Conditions',
                        de: 'AGB',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Link to General Terms and Conditions',
                          de: 'Link zu den Allgemeinen Geschäftsbedingungen',
                        },
                      },
                    },
                    {
                      name: 'privacyContactEmail',
                      type: 'email',
                      label: {
                        en: 'Privacy Contact Email',
                        de: 'Datenschutz-Kontakt',
                      },
                      admin: {
                        width: '50%',
                        description: {
                          en: 'Email for privacy inquiries',
                          de: 'E-Mail für Datenschutzanfragen',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Stripe & Payments',
            de: 'Stripe & Zahlungen',
          },
          fields: [
            {
              name: 'commissionRate',
              type: 'number',
              label: {
                en: 'Commission Rate (%)',
                de: 'Provisionssatz (%)',
              },
              min: 0,
              max: 100,
              admin: {
                description: {
                  en: 'If empty, default value (5%) is used.',
                  de: 'Falls leer, wird der Standardwert (5%) verwendet.',
                },
                step: 0.1,
              },
              access: {
                update: getAccess(['admin'], 'update') as FieldAccess,
              },
            },
            {
              type: 'group',
              label: {
                en: 'Stripe Business Information',
                de: 'Stripe Business Information',
              },
              fields: stripeBusinessFields,
            },
          ],
        },
        {
          label: {
            en: 'System',
            de: 'System',
          },
          description: {
            en: 'System fields and Access Control',
            de: 'System-Felder und Access-Control',
          },
          fields: [
            {
              name: 'billingButton',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/BillingButton#BillingButton',
                },
              },
            },
            ...AccessFields,
            ...slugField('displayName'),
            ActivatableField, // isActive
          ],
        },
      ],
    },
  ],
}
