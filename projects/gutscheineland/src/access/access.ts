import type { Access, AccessArgs, AccessResult } from 'payload'
import type { User } from '@/payload-types'

export type Role = 'any' | 'authenticated' | 'admin' | 'self' | 'customer' | 'company' | 'published'

/**
 * - []           → false
 * - ['any']      → true für alle eingeloggten User
 * - ['authenticated'] → true für eingeloggte User
 * - ['admin']    → nur user.roles.includes('admin')
 * - ['self']     → nur eigene Datensätze
 * - ['customer'] → nur Nutzer mit role='customer'
 * - ['company'] → nur Nutzer mit role='company'
 * Kombis:
 * - ['self','customer'] → own OR customer
 */
export const allowRoles =
  (roles: Role[] = []): Access =>
  ({ req: { user } }: AccessArgs<User>): AccessResult => {
    if (roles.length === 0) return false
    if (roles.includes('any')) return true
    if (roles.includes('authenticated')) return Boolean(user)
    if (roles.includes('admin') && user?.isAdmin) return true

    const wantsSelf = roles.includes('self')
    const isPublished = roles.includes('published')
    const targetRole = roles.find((r) => r === 'customer' || r === 'company') as
      | 'customer'
      | 'company'
      | undefined

    // Business‐Role prüfen
    if (targetRole) {
      const hasRole = user?.role === targetRole
      if (hasRole) return true
      if (wantsSelf) return { id: { equals: user?.id } }
      return false
    }

    // Nur 'self'
    if (wantsSelf) {
      return { id: { equals: user?.id } }
    }

    if (isPublished) {
      return {
        _status: {
          equals: 'published',
        },
      }
    }

    return false
  }

export const NOTauthenticatedOrAdmin: Access = ({ req: { user } }) => {
  if (!user || !user.isAdmin) {
    return false
  }
  return true
}

export const ownsAssetOrAdmin = ({ req: { user } }: AccessArgs) => {
  if (user?.isAdmin) {
    return true
  }
  if (user) {
    return {
      ownedBy: {
        equals: user.id,
      },
    }
  }
  return false
}
