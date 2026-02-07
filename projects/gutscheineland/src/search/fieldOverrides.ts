import { Field } from 'payload'
import { MediaSlug } from '@/slugs'

export const searchFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    index: true,
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'meta',
    label: {
      en: 'Meta',
      de: 'Meta',
    },
    type: 'group',
    index: true,
    admin: {
      readOnly: true,
    },
    fields: [
      {
        type: 'text',
        name: 'title',
        label: {
          en: 'Title',
          de: 'Titel',
        },
      },
      {
        type: 'text',
        name: 'description',
        label: {
          en: 'Description',
          de: 'Beschreibung',
        },
      },
      {
        name: 'image',
        label: {
          en: 'Image',
          de: 'Bild',
        },
        type: 'upload',
        relationTo: MediaSlug,
      },
    ],
  },
  {
    label: {
      en: 'Categories',
      de: 'Kategorien',
    },
    name: 'categories',
    type: 'array',
    admin: {
      readOnly: true,
    },
    fields: [
      {
        name: 'relationTo',
        type: 'text',
      },
      {
        name: 'categoryID',
        type: 'text',
      },
      {
        name: 'title',
        type: 'text',
      },
    ],
  },
]
