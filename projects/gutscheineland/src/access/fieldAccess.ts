import type { FieldAccess } from 'payload'
import type { User } from '@/payload-types'
import { FieldAccessArgs } from 'node_modules/payload/dist/fields/config/types'

export type Role = 'any' | 'authenticated' | 'admin' | 'self' | 'customer' | 'companie'

/**
 * Erzeugt eine Field-Access-Funktion, die:
 * - []                        → false
 * - ['any']                   → alle angemeldeten User
 * - ['authenticated']         → nur eingeloggte User
 * - ['admin']                 → nur User mit role 'admin'
 * - ['self']                  → nur Zugriff auf das eigene Dokument (doc.id === user.id)
 * - Kombis: 'self' + 'admin'  → eigenes Doc oder Admin
 */
export const allowFieldRoles =
  (roles: Role[] = []): FieldAccess<User> =>
  ({ req: { user }, doc }: FieldAccessArgs<User>) => {
    // 1) kein Rollen-Array → false
    if (roles.length === 0) return false

    // 2) 'any' → jeder eingeloggte User
    if (roles.includes('any')) {
      return Boolean(user)
    }

    // 3) 'authenticated' → nur eingeloggte User
    if (roles.includes('authenticated')) {
      return Boolean(user)
    }

    // 4) 'admin' → nur wenn user.roles.includes('admin')
    if (roles.includes('admin') && user?.isAdmin) {
      return true
    }

    // 5) 'self' → nur eigenes Dokument
    if (roles.includes('self')) {
      return Boolean(user && doc && user.id === doc.id)
    }

    return false
  }
