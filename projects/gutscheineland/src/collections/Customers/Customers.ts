import { isVisible } from '@/access/visibility'
import type { CollectionConfig } from 'payload'
import { CustomersSlug } from '@/slugs'

export const Customers: CollectionConfig = {
  slug: CustomersSlug,
  labels: {
    singular: {
      en: 'Customer',
      de: 'Kunde',
    },
    plural: {
      en: 'Customers',
      de: 'Kunden',
    },
  },
  auth: false, // Critical: No login for customers in this MVP
  admin: {
    group: {
      en: 'User Management',
      de: 'Benutzerverwaltung',
    },
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'createdAt'],
    hidden: isVisible(['admin', 'company'])
  },
  access: {
    read: ({ req: { user } }) => {
      // Only admins or companies (users) can read customer data
      // For the MVP, we can keep it simple: Authenticated users (Admins/Companies)
      return Boolean(user)
    },
    create: () => false, // Created only via system/hooks (e.g. when buying a card)
    update: ({ req: { user } }) => Boolean(user), // Admins/Companies can update
    delete: ({ req: { user } }) => Boolean(user), // Admins/Companies can delete
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      label: {
        en: 'Email Address',
        de: 'E-Mail Adresse',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      label: {
        en: 'First Name',
        de: 'Vorname',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      label: {
        en: 'Last Name',
        de: 'Nachname',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: {
        en: 'Phone Number',
        de: 'Telefonnummer',
      },
    },
    // We can add a "Notes" field for CRM purposes later
  ],
}
