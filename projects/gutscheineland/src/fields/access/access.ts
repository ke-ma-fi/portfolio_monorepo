import { Field } from 'payload'
import { UsersSlug } from '@/slugs'
import { handleOwnership } from './handleAccess'

export const AccessFields: Field[] = [
  {
    name: 'ownedBy',
    type: 'relationship',
    relationTo: UsersSlug,
    hasMany: false,
    label: {
      en: 'Owned By',
      de: 'Gehört',
    },
    admin: { readOnly: true },
    access: {
      create: () => false, // Prevent creation of this field
      update: () => false, // Prevent updates to this field
    },
    hooks: {
      beforeChange: [handleOwnership],
    },
  },
  {
    name: 'canRead',
    type: 'relationship',
    relationTo: UsersSlug,
    hasMany: true,
    label: {
      en: 'Can Read',
      de: 'Kann lesen',
    },
    admin: { readOnly: true },
    access: {
      create: () => false, // Prevent creation of this field
      update: () => false, // Prevent updates to this field
    },
    hooks: {
      beforeChange: [],
    },
  },
  {
    name: 'canUpdate',
    type: 'relationship',
    relationTo: UsersSlug,
    hasMany: true,
    label: {
      en: 'Can Update',
      de: 'Kann bearbeiten',
    },
    admin: { readOnly: true },
    access: {
      create: () => false, // Prevent creation of this field
      update: () => false, // Prevent updates to this field
    },
    hooks: {
      beforeChange: [],
    },
  },
]
