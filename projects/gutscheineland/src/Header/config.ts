import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'
import { allowRoles } from '@/access/access'
import { isVisible } from '@/access/visibility'

export const Header: GlobalConfig = {
  slug: 'header',
  label: {
    en: 'Header',
    de: 'Kopfzeile',
  },
  access: {
    read: () => true,
    update: allowRoles(['admin']),
  },
  admin: {
    hidden: isVisible(['admin']) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
          disableLabel: false,
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
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
