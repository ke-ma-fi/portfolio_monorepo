import type { CollectionConfig } from 'payload'

import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { AccessFields } from '@/fields/access/access'
import { isVisible } from '@/access/visibility'
import { getAccess } from '@/access/accessSystem'
import { MediaSlug, PagesSlug } from '@/slugs'

export const Pages: CollectionConfig<typeof PagesSlug> = {
  slug: PagesSlug,
  labels: {
    singular: {
      en: 'Page',
      de: 'Seite',
    },
    plural: {
      en: 'Pages',
      de: 'Seiten',
    },
  },
  access: {
    create: getAccess(['admin'], 'create'),
    read: getAccess(['admin', 'published'], 'read'),
    update: getAccess(['admin'], 'update'),
    delete: getAccess(['admin'], 'delete'),
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    group: {
      en: 'Content',
      de: 'Inhalt',
    },
    hidden: isVisible(['admin']),
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: PagesSlug,
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: PagesSlug,
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: {
        en: 'Title',
        de: 'Titel',
      },
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: {
            en: 'Hero',
            de: 'Hero',
          },
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: {
            en: 'Content',
            de: 'Inhalt',
          },
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: MediaSlug,
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      label: {
        en: 'Published At',
        de: 'Veröffentlicht am',
      },
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    ...AccessFields,
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
