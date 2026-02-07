import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { de } from '@payloadcms/translations/languages/de'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

/**
 * Core Payload CMS Configuration
 * 
 * This file configures the Payload CMS instance, including:
 * - Database adapter (PostgreSQL)
 * - Email adapter (Nodemailer / Brevo)
 * - Collections (Data definitions)
 * - Globals (Global settings like Header/Footer)
 * - Admin panel settings
 * - Authentication and Access Control
 */

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { Tags } from './collections/Tags'
import { Companies } from './collections/Companies/Companies'
import { GiftCards } from './collections/GiftCards/Giftcards'
import { GiftCardOffers } from './collections/GiftCardOffers'
import { GiftCardTransactions } from './collections/Transactions'
import { PaymentTransactions } from './collections/PaymentTransactions'
import { Invoices } from './collections/Invoices'
import { Customers } from './collections/Customers/Customers'
//import { migrations } from './migrations'
import { payloadEndpoints } from './endpoints'
import { Settings } from './globals/Settings/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const migrations = process.env.APP_ENV === 'production' ? (await import('./migrations')).migrations : undefined

export default buildConfig({
  debug: true,
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM || 'no-reply@gutscheineland.de',
    defaultFromName: 'Gutscheineland',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  i18n: {
    supportedLanguages: { en, de },
    fallbackLanguage: 'en',
    translations: {
      de: {
        'plugin-redirects': {
          fromUrl: 'Von URL',
          toUrlType: 'Zielart',
          internalLink: 'Interner Link',
          customUrl: 'Benutzerdefinierte URL',
          documentToRedirect: 'Ziel-Dokument',
        },
      },
    },
  },
  admin: {
    meta: {
      titleSuffix: '- Account',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
    },
    components: {
      graphics: {
        Logo: '@/components/Logo/Logo_Admin',
        Icon: '@/components/Logo/Icon_Admin',
      },
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard/CompanyDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    prodMigrations: migrations,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Customers,
    Tags,
    Companies,
    GiftCards,
    GiftCardOffers,
    GiftCardTransactions,
    PaymentTransactions,
    Invoices,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, Settings],
  plugins: [
    ...plugins,
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  endpoints: payloadEndpoints,
})
