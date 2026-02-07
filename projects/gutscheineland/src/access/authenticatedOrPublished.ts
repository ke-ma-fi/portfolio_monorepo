import type { Access } from 'payload'

export const isPublished: Access = () => {
  return {
    _status: {
      equals: 'published',
    },
  }
}
