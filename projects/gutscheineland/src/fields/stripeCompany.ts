import type { Field } from 'payload'

export const stripeBusinessFields: Field[] = [
  {
    name: 'stripeAccountId',
    type: 'text',
    required: true,
    index: true,
    label: {
      en: 'Stripe Account ID',
      de: 'Stripe Account ID',
    },
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'businessType',
    type: 'select',
    options: ['individual', 'company'],
    label: {
      en: 'Business Type',
      de: 'Unternehmensart',
    },
    admin: { readOnly: true },
  },
  {
    name: 'legalName',
    type: 'text',
    label: {
      en: 'Legal Name',
      de: 'Rechtlicher Name',
    },
    admin: { readOnly: true },
  },
  {
    name: 'person',
    type: 'group',
    label: {
      en: 'Person',
      de: 'Person',
    },
    fields: [
      {
        name: 'personId',
        type: 'text',
        label: {
          en: 'Person ID',
          de: 'Personen-ID',
        },
        admin: { readOnly: true },
      },
      {
        name: 'firstName',
        type: 'text',
        label: {
          en: 'First Name',
          de: 'Vorname',
        },
        admin: { readOnly: true },
      },
      {
        name: 'lastName',
        type: 'text',
        label: {
          en: 'Last Name',
          de: 'Nachname',
        },
        admin: { readOnly: true },
      },
    ],
  },
  {
    name: 'businessProfile',
    type: 'group',
    label: {
      en: 'Business Profile',
      de: 'Unternehmensprofil',
    },
    fields: [
      {
        name: 'websiteUrl',
        type: 'text',
        label: {
          en: 'Website URL',
          de: 'Webseiten-URL',
        },
        admin: { readOnly: true },
      },
      {
        name: 'mcc',
        type: 'text',
        label: {
          en: 'MCC',
          de: 'MCC',
        },
        admin: { readOnly: true },
      },
    ],
  },
  {
    name: 'bankInfo',
    type: 'group',
    label: {
      en: 'Bank Information',
      de: 'Bankinformationen',
    },
    fields: [
      {
        name: 'last4',
        type: 'text',
        label: {
          en: 'Last 4 Digits',
          de: 'Letzte 4 Ziffern',
        },
        admin: { readOnly: true },
      },
      {
        name: 'bankName',
        type: 'text',
        label: {
          en: 'Bank Name',
          de: 'Bankname',
        },
        admin: { readOnly: true },
      },
      {
        name: 'currency',
        type: 'text',
        label: {
          en: 'Currency',
          de: 'Währung',
        },
        admin: { readOnly: true },
      },
      {
        name: 'country',
        type: 'text',
        label: {
          en: 'Country',
          de: 'Land',
        },
        admin: { readOnly: true },
      },
    ],
  },
  {
    name: 'taxIdProvided',
    type: 'checkbox',
    label: {
      en: 'Tax ID Provided',
      de: 'Steuer-ID angegeben',
    },
    admin: { readOnly: true },
  },
  {
    name: 'chargesEnabled',
    type: 'checkbox',
    label: {
      en: 'Charges Enabled',
      de: 'Zahlungen aktiviert',
    },
    admin: { readOnly: true },
  },
  {
    name: 'payoutsEnabled',
    type: 'checkbox',
    label: {
      en: 'Payouts Enabled',
      de: 'Auszahlungen aktiviert',
    },
    admin: { readOnly: true },
  },
  {
    name: 'detailsSubmitted',
    type: 'checkbox',
    label: {
      en: 'Details Submitted',
      de: 'Details übermittelt',
    },
    admin: { readOnly: true },
  },
  {
    name: 'onboardingComplete',
    type: 'checkbox',
    label: {
      en: 'Onboarding Complete',
      de: 'Onboarding abgeschlossen',
    },
    admin: { readOnly: true },
  },
]
