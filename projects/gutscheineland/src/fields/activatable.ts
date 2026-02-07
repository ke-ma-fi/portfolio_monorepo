import type { Field } from 'payload'

export const ActivatableField: Field = {
  name: 'isActive',
  type: 'checkbox',
  defaultValue: true,
  label: {
    en: 'Active',
    de: 'Aktiv',
  },
  admin: {
    position: 'sidebar',
    description: {
      en: 'Toggle active status',
      de: 'Aktiv-Status umschalten',
    },
  },
}
