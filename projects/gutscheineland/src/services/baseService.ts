import { getPayload, Payload, PayloadRequest } from 'payload'
import configPromise from '@payload-config'

export interface ServiceOptions {
  req?: PayloadRequest
}

/**
 * Helper to ensure a Service has access to the Payload instance.
 * It prefers the instance attached to `req` (for transaction/context),
 * but falls back to a fresh local API instance if `req` is missing.
 */
export async function getServicePayload(options?: ServiceOptions): Promise<Payload> {
  if (options?.req?.payload) {
    return options.req.payload
  }
  return await getPayload({ config: configPromise })
}
