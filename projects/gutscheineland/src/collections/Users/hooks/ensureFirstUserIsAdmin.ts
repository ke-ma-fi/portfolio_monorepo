import type { FieldHook } from 'payload'
import type { User } from '@/payload-types'
import { shouldFirstUserBeAdmin } from '@/services/users'

// Stellt sicher, dass der erste angelegte User automatisch isAdmin = true bekommt
export const ensureFirstUserIsAdmin: FieldHook<User> = async ({ operation, req, value }) => {
  if (operation === 'create') {
      const isFirst = await shouldFirstUserBeAdmin({ req })
      if (isFirst) {
          return true
      }
  }
  return value
}
