import type { Block } from 'payload'
import { MediaSlug } from '@/slugs'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: MediaSlug,
      required: true,
    },
  ],
}
