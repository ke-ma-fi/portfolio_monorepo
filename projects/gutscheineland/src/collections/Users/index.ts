import type { CollectionConfig, FieldAccess } from 'payload'
import { authenticated } from '@/access/authenticated'
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { getAccess } from '@/access/accessSystem'
import { UserComponents } from '@/fields/ui/forUsers'
import { StripeConnectFields } from '@/fields/stripeConnect'
import { isVisible } from '@/access/visibility'
import { UsersSlug } from '@/slugs'

export const Users: CollectionConfig = {
  slug: UsersSlug,
  labels: {
    singular: {
      en: 'User',
      de: 'Benutzer',
    },
    plural: {
      en: 'Users',
      de: 'Benutzer',
    },
  },
  auth: true,
  access: {
    admin: authenticated,
    create: getAccess(['admin', 'notAuthenticated'], 'create'),
    delete: getAccess(['admin'], 'delete'),
    read: getAccess(['admin', 'self'], 'read'),
    update: getAccess(['admin', 'self'], 'update'),
  },
  admin: {
    group: {
      en: 'User Management',
      de: 'Benutzerverwaltung',
    },
    defaultColumns: ['name', 'email'],
    useAsTitle: 'email',
    hidden: isVisible(['admin'])
  },
  fields: [
    ...UserComponents,
    {
      name: 'firstName',
      type: 'text',
      label: {
        en: 'First Name',
        de: 'Vorname',
      },
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      label: {
        en: 'Last Name',
        de: 'Nachname',
      },
      required: true,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      label: {
        en: 'Phone Number',
        de: 'Telefonnummer',
      },
    },
    {
      name: 'isAdmin',
      type: 'checkbox',
      label: {
        en: 'Admin?',
        de: 'Admin?',
      },
      defaultValue: false,
      saveToJWT: true,
      access: {
        create: getAccess(['admin'], 'create') as FieldAccess,
        update: getAccess(['admin'], 'update') as FieldAccess,
      },
      admin: {
        condition: (data, siblingData, { user }) => {
          return user?.isAdmin || false
        },
      },
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
    },
    {
      name: 'role',
      type: 'select',
      label: {
        en: 'Role',
        de: 'Rolle',
      },
      options: [
        {
          label: {
            en: 'Customer',
            de: 'Kunde',
          },
          value: 'customer',
        },
        {
          label: {
            en: 'Company',
            de: 'Unternehmen',
          },
          value: 'company',
        },
      ],
      hasMany: false,
      defaultValue: 'customer',
      saveToJWT: true,
      access: {
        create: getAccess(['admin'], 'create') as FieldAccess,
        update: getAccess(['admin'], 'update') as FieldAccess,
      },
      admin: {
        condition: (data, siblingData, { user }) => {
          return user?.isAdmin || false
        },
      },
    },
    ...StripeConnectFields,
  ],
  timestamps: true,
  versions: true,
}
