import { ClientUser } from 'payload'

type Role = 'anyone' | 'admin' | 'customer' | 'company'
type isVisible = (roles: Role[]) => (args: { user: ClientUser | null }) => boolean

// The `isVisible` function determines whether a resource should be visible
// based on the roles of the current user and the specified roles.
export const isVisible: isVisible =
  (roles: Role[] = []) =>
  ({ user }) => {
    // If no user is logged in, the resource is visible
    if (!user) return true

    // If the roles include 'anyone', the resource is hidden for all users
    if (roles.includes('anyone')) return false

    if (roles.includes('admin') && user.isAdmin) {
      // If the user is an admin, the resource is visible
      return false
    }

    // If the user's role does not match any of the specified roles, the resource is hidden
    if (roles.length > 0 && user.role) {
      return !roles.includes(user.role)
    }

    // Default: hidden
    return true
  }
