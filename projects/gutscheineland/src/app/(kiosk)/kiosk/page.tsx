import React from 'react'
import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import KioskInterface from '@/components/Kiosk/KioskInterface'

export default async function KioskPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/admin/login?redirect=/kiosk',
    validUserRedirect: '', // Stay if logged in
  })

  if (user.role !== 'company' && !user.isAdmin) {
    redirect('/admin')
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <KioskInterface />
    </div>
  )
}