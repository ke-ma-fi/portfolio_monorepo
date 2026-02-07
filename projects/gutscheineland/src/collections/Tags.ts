import type { CollectionConfig } from 'payload'
import { slugField } from '@/fields/slug'
import { AccessFields } from '@/fields/access/access'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { TagsSlug } from '@/slugs'

export const Tags: CollectionConfig = {
  slug: TagsSlug,
  labels: {
    singular: {
      en: 'Tag',
      de: 'Tag',
    },
    plural: {
      en: 'Tags',
      de: 'Tags',
    },
  },
  access: {
    create: getAccess(['admin', 'company'], 'create'),
    read: getAccess(['anyone'], 'read'),
    update: getAccess(['admin', 'owned'], 'update'),
    delete: getAccess(['admin'], 'delete'),
  },
  admin: {
    group: {
      en: 'Content',
      de: 'Inhalt',
    },
    hidden: isVisible(['admin']),
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: {
        en: 'Name',
        de: 'Name',
      },
    },
    ...slugField('name'),
    ...AccessFields,
  ],
}
