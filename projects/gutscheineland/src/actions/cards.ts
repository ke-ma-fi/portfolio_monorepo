'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { markCardAsPrinted } from '@/services/cards'
import { revalidatePath } from 'next/cache'

export async function markAsPrintedAction(uuid: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    if (!uuid) return { error: 'UUID required', status: 400 }

    // We pass req: { payload } to satisfy the service signature 
    // while keeping it compatible with the server action context
    await markCardAsPrinted({ 
      uuid, 
      req: { payload } as any 
    })

    revalidatePath(`/view/${uuid}`)

    return { success: true }
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error marking as printed:', error)
    // Differentiate 404 vs 500 if desired, for now generic error
    return { error: error.message || 'Internal Error', status: 500 }
  }
}
