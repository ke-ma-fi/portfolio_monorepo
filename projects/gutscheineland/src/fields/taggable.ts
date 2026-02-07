import type { Field } from 'payload'
import { TagsSlug } from '@/slugs'

export const TaggableField: Field = {
  name: 'tags',
  type: 'relationship',
  relationTo: TagsSlug,
  hasMany: true,
  label: {
    en: 'Tags',
    de: 'Tags', // or Schlagwörter
  },
}
