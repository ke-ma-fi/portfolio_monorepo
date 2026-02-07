import { Payload, PayloadRequest } from 'payload'
import { CustomersSlug } from '@/slugs'
import { Customer } from '@/payload-types'

interface EnsureCustomerOptions {
  payload: Payload
  req?: PayloadRequest
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

/**
 * Ensures a customer exists in the CRM.
 * Finds by email or creates a new record.
 */
export async function ensureCustomer({
  payload,
  req,
  email,
  firstName,
  lastName,
  phone,
}: EnsureCustomerOptions): Promise<Customer> {
  // 1. Check if customer exists
  const { docs: existingCustomers } = await payload.find({
    req,
    collection: CustomersSlug,
    overrideAccess: true,
    where: {
      email: { equals: email },
    },
    limit: 1,
  })

  // 2. Return existing
  if (existingCustomers.length > 0 && existingCustomers[0]) {
    const customer = existingCustomers[0]
    return customer as Customer
  }

  // 3. Create new customer
  const newCustomer = await payload.create({
    req,
    collection: CustomersSlug,
    overrideAccess: true,
    data: {
      email,
      firstName,
      lastName,
      phone,
    },
  }) as Customer

  return newCustomer
}
