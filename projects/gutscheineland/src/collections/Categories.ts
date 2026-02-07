import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { AccessFields } from '@/fields/access/access'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { CategoriesSlug } from '@/slugs'

export const Categories: CollectionConfig = {
  slug: CategoriesSlug,
  labels: {
    singular: {
      en: 'Category',
      de: 'Kategorie',
    },
    plural: {
      en: 'Categories',
      de: 'Kategorien',
    },
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
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        en: 'Title',
        de: 'Titel',
      },
      required: true,
    },
    ...AccessFields,
    ...slugField(),
  ],
}
