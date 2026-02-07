'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { resendGiftNotification, sendGiftCard, registerRecipient } from '@/services/gifting'

export async function resendGiftEmailAction(uuid: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    if (!uuid) return { error: 'UUID required', status: 400 }

    await resendGiftNotification({ 
      uuid, 
      req: { payload } as any 
    })

    return { success: true, message: 'Email sent successfully' }
  } catch (error: any) {
    console.error('Error resending gift email:', error)
    return { error: error.message || 'Internal Error', status: 500 }
  }
}

export async function sendGiftCardAction(uuid: string, email: string, name: string, message: string) {
  try {
    const payload = await getPayload({ config: configPromise })

    if (!uuid || !email || !name) return { error: 'Missing fields', status: 400 }

    await sendGiftCard({
      uuid,
      email,
      name,
      message,
      req: { payload } as any
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error sending gift card:', error)
    // Pass strictly checked error messages through, otherwise 500
    // The service throws user-friendly messages for known constraints
    return { error: error.message || 'Internal Error', status: 500 }
  }
}

export async function registerRecipientAction(uuid: string, email: string) {
  try {
     const payload = await getPayload({ config: configPromise })
     
     if (!uuid || !email) return { error: 'Missing fields', status: 400 }

     await registerRecipient({
       uuid,
       email,
       req: { payload } as any
     })
     
     return { success: true }
  } catch(error: any) {
      console.error('Error registering recipient:', error)
      return { error: error.message || 'Internal Error', status: 500 }
  }
}
