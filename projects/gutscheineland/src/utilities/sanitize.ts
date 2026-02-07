import sanitizeHtml from 'sanitize-html'

/**
 * HTML sanitization utilities for email templates
 * Prevents XSS attacks from user-provided content in emails
 */

/**
 * Escape HTML special characters to prevent XSS.
 * Uses sanitize-html to escape all tags, making them render as text.
 * @param text - User-provided text to escape
 * @returns Escaped text safe for HTML rendering
 */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''

  return sanitizeHtml(text, {
    allowedTags: [], // No tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'escape', // Escape tags instead of removing them (e.g. <script> becomes &lt;script&gt;)
  })
}

/**
 * Sanitize text for use in HTML attributes (e.g., alt, title)
 * @param text - Text to sanitize
 * @returns Sanitized text safe for HTML attributes
 */
export function sanitizeAttribute(text: string | undefined | null): string {
  if (!text) return ''

  // escapeHtml gives us safe text, then we clean up newlines for attributes
  return escapeHtml(text).replace(/\n/g, ' ').replace(/\r/g, '')
}

/**
 * Sanitize text for use in email messages, preserving basic line breaks
 * Converts newlines to <br> tags
 * @param text - Text to sanitize
 * @returns Sanitized HTML-safe text with line breaks
 */
export function sanitizeEmailMessage(text: string | undefined | null): string {
  if (!text) return ''

  // First replace newlines with BR placeholder to persist them through sanitization if we were stripping
  // OR, simpler: Escape everything, then turn newlines to <br>
  // This matches the previous logic: treat input as text, make it safe, then format lines.
  return escapeHtml(text).replace(/\n/g, '<br>')
}

/**
 * Validate and sanitize URLs to prevent javascript: and data: URI attacks
 * @param url - URL to validate
 * @returns Sanitized URL if safe, empty string if unsafe
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return ''
  
  const trimmed = url.trim()
  
  // Allow only http and https protocols
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed
    }
  } catch {
    // Not a valid URL, could be relative
    // Allow relative URLs that don't start with javascript:, data:, vbscript:, or file:
    if (!trimmed.match(/^(javascript|data|vbscript|file):/i)) {
      return trimmed
    }
  }
  
  return ''
}
