import type { GlobalConfig } from 'payload'
import type { User } from '@/payload-types'
import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'
import { allowRoles } from '@/access/access'
import { isVisible } from '@/access/visibility'
import { UsersSlug } from '@/slugs'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: {
    en: 'Footer',
    de: 'Fußzeile',
  },
  access: {
    read: () => true,
    update: allowRoles(['admin']),
  },
  admin: {
    hidden: isVisible(['admin']) as (args: {
      user: (User & { collection: typeof UsersSlug }) | null
    }) => boolean,
  },
  fields: [
    {
      name: 'navItems',
      label: {
        en: 'Navigation Items',
        de: 'Navigationselemente',
      },
      type: 'array',
      fields: [
        link({
          appearances: false,
          overrides: {
            label: {
              en: 'Link',
              de: 'Link',
            },
          },
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
