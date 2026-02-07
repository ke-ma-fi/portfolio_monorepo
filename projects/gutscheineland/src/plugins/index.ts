import { stripePlugin } from '@payloadcms/plugin-stripe'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { CategoriesSlug, PagesSlug, PostsSlug, MediaSlug } from '@/slugs'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { stripeWebhooks } from './stripeWebhooks'
import { s3Storage } from '@payloadcms/storage-s3'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: [PagesSlug, PostsSlug],
    overrides: {
      labels: {
        singular: {
          en: 'Redirect',
          de: 'Weiterleitung',
        },
        plural: {
          en: 'Redirects',
          de: 'Weiterleitungen',
        },
      },
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      access: {
        create: getAccess(['admin'], 'create'),
        delete: getAccess(['admin'], 'delete'),
        read: getAccess(['admin'], 'read'),
        update: getAccess(['admin'], 'update'),
      },
      admin: {
        group: {
          en: 'Settings',
          de: 'Einstellungen',
        },
        hidden: isVisible(['admin']),
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: [CategoriesSlug],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      labels: {
        singular: {
          en: 'Form',
          de: 'Formular',
        },
        plural: {
          en: 'Forms',
          de: 'Formulare',
        },
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
      access: {
        create: getAccess(['admin'], 'create'),
        delete: getAccess(['admin'], 'delete'),
        read: getAccess(['anyone'], 'read'),
        update: getAccess(['admin'], 'update'),
      },
      admin: {
        group: {
          en: 'Content',
          de: 'Inhalt',
        },
        hidden: isVisible(['admin']),
      },
    },
    formSubmissionOverrides: {
      labels: {
        singular: {
          en: 'Form Submission',
          de: 'Formulareinsendung',
        },
        plural: {
          en: 'Form Submissions',
          de: 'Formulareinsendungen',
        },
      },
      access: {
        read: getAccess(['admin'], 'read'),
        update: () => false,
        delete: getAccess(['admin'], 'delete'),
      },
      admin: {
        group: {
          en: 'Content',
          de: 'Inhalt',
        },
        hidden: isVisible(['admin']),
      },
    },
  }),
  searchPlugin({
    collections: [PostsSlug],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      labels: {
        singular: {
          en: 'Search Result',
          de: 'Suchergebnis',
        },
        plural: {
          en: 'Search Results',
          de: 'Suchergebnisse',
        },
      },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
      access: {
        create: getAccess(['admin'], 'create'),
        update: getAccess(['admin'], 'update'),
        delete: getAccess(['admin'], 'delete'),
      },
      admin: {
        group: {
          en: 'Content',
          de: 'Inhalt',
        },
        hidden: isVisible(['admin']),
      },
    },
  }),
  payloadCloudPlugin(),
  stripePlugin({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    rest: true,
    webhooks: stripeWebhooks,
  }),
  s3Storage({
    collections: {
      [MediaSlug]: {
        disablePayloadAccessControl: true,
      },
    },
    bucket: process.env.S3_BUCKET || '',
    config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || '',
        forcePathStyle: true,
        endpoint: process.env.S3_ENDPOINT || '',
      },
  }),
]
