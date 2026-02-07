import type { GlobalConfig } from 'payload'
import { allowRoles } from '@/access/access'
import { SettingsSlug } from '@/slugs'

export const Settings: GlobalConfig = {
  slug: SettingsSlug,
  label: {
    en: 'Settings',
    de: 'Einstellungen',
  },
  access: {
    read: () => true, // Everyone (system) needs to read this? Or just admin/server? Server needs it.
    update: allowRoles(['admin']),
  },
  fields: [
    {
      name: 'defaultCommissionRate',
      type: 'number',
      label: {
        en: 'Default Commission Rate (%)',
        de: 'Standard-Provisionssatz (%)',
      },
      defaultValue: 5,
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: {
          en: 'Default commission retained from each sale (if not set otherwise for the company).',
          de: 'Standard-Provision, die von jedem Verkauf einbehalten wird (falls beim Unternehmen nichts anderes eingestellt ist).',
        },
        step: 0.1,
      },
    },
  ],
}
