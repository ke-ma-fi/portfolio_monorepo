import type { CollectionAfterReadHook } from 'payload'
import { getPublicUserProfiles } from '@/services/users'

export const populateAuthors: CollectionAfterReadHook = async ({ doc, req }) => {
  if (doc?.authors && doc?.authors?.length > 0) {
      // Extract IDs
      const ids = doc.authors.map((author: any) => 
          typeof author === 'object' ? author?.id : author
      ).filter(Boolean)

      const profiles = await getPublicUserProfiles({ req, ids })
      
      if (profiles.length > 0) {
          doc.populatedAuthors = profiles
      }
  }

  return doc
}
