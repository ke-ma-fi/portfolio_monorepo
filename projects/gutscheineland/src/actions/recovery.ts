'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { recoverCards } from '@/services/recovery'

export async function resendCardsAction(email: string) {
  try {
    if (!email || typeof email !== 'string') {
      return { error: 'Invalid email', status: 400 }
    }

    const payload = await getPayload({ config: configPromise })

    await recoverCards({
      email,
      req: { payload } as any,
    })

    return { message: 'If this email exists, a link has been sent.' }
  } catch (error) {
    console.error('Error in resend-cards:', error)
    return { error: 'Internal Server Error', status: 500 }
  }
}
