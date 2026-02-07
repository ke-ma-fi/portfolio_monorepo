import { PayloadHandler } from 'payload'
import { createInvoiceForCompany } from '@/services/billing/createInvoice'

export const runBillingEndpoint: PayloadHandler = async (req): Promise<Response> => {
  if (!req.user || req.user.collection !== 'users') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Double check for admin role if needed, but 'users' collection is usually sufficient for internal tools
  // If we want to be strict:
  // if (!req.user.roles.includes('admin')) ...

  try {
    const body = (req.json ? await req.json() : {}) as any
    const { companyId } = body

    if (!companyId) {
      return Response.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const invoice = await createInvoiceForCompany({
      companyId,
      payload: req.payload,
      req,
    })

    if (!invoice) {
      return Response.json({ message: 'No open transactions found to bill', invoice: null }, { status: 200 })
    }

    return Response.json({ message: 'Billing run successful', invoice }, { status: 200 })
  } catch (error) {
    console.error('Billing Endpoint Error:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
