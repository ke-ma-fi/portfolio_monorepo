import { PayloadRequest } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

interface RevalidateOptions {
  req: PayloadRequest
  slug?: string
  status?: string
  previousStatus?: string
  previousSlug?: string
}

export function revalidatePostCache({ req, slug, status, previousStatus, previousSlug }: RevalidateOptions) {
  const { context, payload } = req
  
  if (!context.disableRevalidate) {
    if (status === 'published' && slug) {
      const path = `/posts/${slug}`
      payload.logger.info(`Revalidating post at path: ${path}`)
      revalidatePath(path)
      revalidateTag('posts-sitemap', {})
    }

    if (previousStatus === 'published' && status !== 'published' && previousSlug) {
      const oldPath = `/posts/${previousSlug}`
      payload.logger.info(`Revalidating old post at path: ${oldPath}`)
      revalidatePath(oldPath)
      revalidateTag('posts-sitemap', {})
    }
  }
}
