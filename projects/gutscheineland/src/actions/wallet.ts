'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createGoogleWalletLink } from '@/services/wallet'

export async function generateGoogleWalletLinkAction(uuid: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    if (!uuid) return { error: 'UUID required' }
    
    const { url } = await createGoogleWalletLink({
        uuid,
        req: { payload } as any
    })
    
    return { url }
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Google Wallet Action Error:', error)
    return { error: error.message || 'Failed to generate link' }
  }
}
