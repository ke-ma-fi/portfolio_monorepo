import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { Post } from '../../../payload-types'
import { revalidatePostCache } from '@/services/posts'
import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req,
}) => {
  revalidatePostCache({
      req,
      slug: doc.slug!,
      status: doc._status!,
      previousStatus: previousDoc?._status || undefined,
      previousSlug: previousDoc?.slug || undefined,
  })
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('posts-sitemap', {})
  }

  return doc
}
