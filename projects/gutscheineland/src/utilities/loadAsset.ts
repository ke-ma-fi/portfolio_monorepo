import fs from 'fs'
import path from 'path'
import { Media } from '@/payload-types'

/**
 * Loads an asset as a Buffer from a local path, a URL, or a Payload Media object.
 * This abstracts the storage layer (Local FS vs S3 vs Remote URL).
 *
 * @param media - The Media object or string path/url
 * @returns Buffer containing the file data or undefined if not found
 */
export const loadAsset = async (media: Media | string | null | undefined): Promise<Buffer | undefined> => {
  if (!media) return undefined

  let assetPath = ''

  // 1. Extract path/url from Media object
  if (typeof media === 'object') {
    if (media.url) {
      assetPath = media.url
    } else {
      // Fallback: If no URL is present on the object (rare), try constructing a local path
      // This is risky if strict S3 is used without public URLs, but standard Payload behavior usually has a URL.
      // For local uploads, we might have a filename but need to know the base dir.
      return undefined
    }
  } else {
    assetPath = media
  }

  // 2. Load from URL (Remote / S3)
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    try {
      const response = await fetch(assetPath)
      if (!response.ok) {
        console.warn(`Failed to fetch asset from URL: ${assetPath} (${response.status})`)
        return undefined
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error(`Error fetching asset from URL: ${assetPath}`, error)
      return undefined
    }
  }

  // 3. Load from Local Filesystem using Public directory
  // If the path starts with '/', it's likely relative to the public/ folder or root
  // We assume standard Next.js / Payload setup where static files are in 'public'
  
  // Clean path to be safe
  const cleanPath = assetPath.split('?')[0] || '' // Remove query params and ensure string
  
  // Try resolving against CWD/public
  const publicPath = path.join(process.cwd(), 'public', cleanPath)
  if (fs.existsSync(publicPath)) {
      return fs.readFileSync(publicPath)
  }
  
  // Try resolving as absolute path (server-side generation sometimes passes full paths)
  if (fs.existsSync(cleanPath)) {
      return fs.readFileSync(cleanPath)
  }

  // Fallback: Try resolving relative to CWD directly
  const cwdPath = path.join(process.cwd(), cleanPath)
  if (fs.existsSync(cwdPath)) {
      return fs.readFileSync(cwdPath)
  }

  console.warn(`Asset not found locally: ${assetPath} (Checked: ${publicPath})`)
  return undefined
}
