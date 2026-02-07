import { Access, AccessArgs, AccessResult, User } from 'payload'

/**
 * 🔐 getAccess(rules, operation)
 *
 * Central access control function for all Payload CMS collections.
 * Evaluates a list of access rules based on user roles, ownership, or document fields.
 *
 * @param rules - List of access keywords to check (first match wins).
 * @param operation - Payload operation context: 'read' | 'create' | 'update' | 'delete'.
 *
 * ✅ Supported AccessKeys:
 * - 'anyone'             → always allow
 * - 'notAuthenticated'   → only allow if user is not logged in
 * - 'authenticated'      → any logged-in user
 * - 'admin'              → user with isAdmin = true
 * - 'company'            → user.role === 'company'
 * - 'customer'           → user.role === 'customer'
 * - 'self'               → filters to user's own user document
 * - 'owned'              → filters to documents with ownedBy = user.id
 * - 'granted'            → filters to documents where can<Operation> = user.id
 * - 'published'          → filters to documents with _status === 'published'
 *
 * 🧠 Behavior:
 * - The first matching rule grants access.
 * - If no rule matches, access is denied (returns false).
 * - For filter-based access (e.g. 'owned'), returns a Payload `where` clause.
 *
 * 💡 Example:
 * ```ts
 * access: {
 *   read: getAccess(['admin', 'owned', 'published'], 'read'),
 *   update: getAccess(['admin', 'owned'], 'update'),
 *   create: getAccess(['authenticated'], 'create'),
 *   delete: getAccess(['admin'], 'delete'),
 * }
 * ```
 */

type AccessKeys =
  | 'anyone'
  | 'authenticated'
  | 'admin'
  | 'company'
  | 'customer'
  | 'self'
  | 'published'
  | 'owned'
  | 'granted'
  | 'notAuthenticated'

type Operation = 'read' | 'create' | 'update' | 'delete'

export const getAccess =
  (rules: AccessKeys[] = [], operation: Operation): Access =>
  ({ req: { user } }: AccessArgs<User>): AccessResult => {
    for (const rule of rules) {
      switch (rule) {
        case 'anyone':
          return true
        case 'authenticated':
          if (user) return true
          break
        case 'admin':
          if (user?.isAdmin) return true
          break
        case 'company':
          if (user?.role === 'company') return true
          break
        case 'customer':
          if (user?.role === 'customer') return true
          break
        case 'self':
          if (user) return { id: { equals: user.id } }
          break
        case 'owned':
          if (user) return { ownedBy: { equals: user.id } }
          break
        case 'granted':
          if (operation === 'read' && user) return { canRead: { equals: user.id } }
          if (operation === 'update' && user) return { canUpdate: { equals: user.id } }
          if (operation === 'delete' && user) return { canDelete: { equals: user.id } }
          if (operation === 'create' && user) return { canCreate: { equals: user.id } }
          break
        case 'published':
          return { _status: { equals: 'published' } }
        case 'notAuthenticated':
          if (!user) return true
          break
      }
    }
    return false
  }
