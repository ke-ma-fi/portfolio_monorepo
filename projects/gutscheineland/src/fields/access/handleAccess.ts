import type { FieldHook } from 'payload'

export const handleOwnership: FieldHook = ({ operation, req, value }) => {
  if (value) return value
  
  if (operation === 'create' && req.user) {
    return req.user.id
  }
}
