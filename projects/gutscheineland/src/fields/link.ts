import type { Field, GroupField } from 'payload'

import { PagesSlug, PostsSlug } from '@/slugs'

import deepMerge from '@/utilities/deepMerge'

export type LinkAppearances = 'default' | 'outline'

export const appearanceOptions: Record<LinkAppearances, { label: { en: string; de: string }; value: string }> = {
  default: {
    label: {
      en: 'Default',
      de: 'Standard',
    },
    value: 'default',
  },
  outline: {
    label: {
      en: 'Outline',
      de: 'Outline',
    },
    value: 'outline',
  },
}

type LinkType = (options?: {
  appearances?: LinkAppearances[] | false
  disableLabel?: boolean
  overrides?: Partial<GroupField>
}) => Field

export const link: LinkType = ({ appearances, disableLabel = false, overrides = {} } = {}) => {
  const linkResult: GroupField = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
            defaultValue: 'reference',
            options: [
              {
                label: {
                  en: 'Internal link',
                  de: 'Interner Link',
                },
                value: 'reference',
              },
              {
                label: {
                  en: 'Custom URL',
                  de: 'Benutzerdefinierte URL',
                },
                value: 'custom',
              },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            admin: {
              style: {
                alignSelf: 'flex-end',
              },
              width: '50%',
            },
            label: {
              en: 'Open in new tab',
              de: 'In neuem Tab öffnen',
            },
          },
        ],
      },
    ],
  }

  const linkTypes: Field[] = [
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: {
        en: 'Document to link to',
        de: 'Verlinktes Dokument',
      },
      relationTo: [PagesSlug, PostsSlug],
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
      },
      label: {
        en: 'Custom URL',
        de: 'Benutzerdefinierte URL',
      },
      required: true,
    },
  ]

  if (!disableLabel) {
    linkTypes.map((linkType) => ({
      ...linkType,
      admin: {
        ...linkType.admin,
        width: '50%',
      },
    }))

    linkResult.fields.push({
      type: 'row',
      fields: [
        ...linkTypes,
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: {
            en: 'Label',
            de: 'Beschriftung',
          },
          required: true,
        },
      ],
    })
  } else {
    linkResult.fields = [...linkResult.fields, ...linkTypes]
  }

  if (appearances !== false) {
    let appearanceOptionsToUse = [appearanceOptions.default, appearanceOptions.outline]

    if (appearances) {
      appearanceOptionsToUse = appearances.map((appearance) => appearanceOptions[appearance])
    }

    linkResult.fields.push({
      name: 'appearance',
      type: 'select',
      admin: {
        description: {
          en: 'Choose how the link should be rendered.',
          de: 'Wählen Sie, wie der Link dargestellt werden soll.',
        },
      },
      defaultValue: 'default',
      options: appearanceOptionsToUse,
    })
  }

  return deepMerge(linkResult, overrides)
}
