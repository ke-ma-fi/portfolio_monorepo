import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { AccessFields } from '@/fields/access/access'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { MediaSlug } from '@/slugs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: MediaSlug,
  labels: {
    singular: {
      en: 'Media',
      de: 'Medien',
    },
    plural: {
      en: 'Media',
      de: 'Medien',
    },
  },
  access: {
    create: getAccess(['admin', 'company'], 'create'),
    delete: getAccess(['admin'], 'delete'),
    read: getAccess(['anyone'], 'read'),
    update: getAccess(['admin', 'owned'], 'update'),
  },
  admin: {
    group: {
      en: 'Content',
      de: 'Inhalt',
    },
    hidden: isVisible(['admin']),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: {
        en: 'Alt Text',
        de: 'Alternativtext',
      },
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      label: {
        en: 'Caption',
        de: 'Bildunterschrift',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    ...AccessFields,
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'), //this is overriden by the storage adapter configured in plugins
    mimeTypes: ['image/*'],
    adminThumbnail: ({ doc }) => {
      // @ts-expect-error - dynamic document type
      const filename = doc?.sizes?.thumbnail?.filename || doc.filename
      return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${filename}`
    },
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
