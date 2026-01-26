/**
 * Handle direct image/video URLs
 */
import { validateUrl, isImageUrl as isImageExtension, isVideoUrl } from '../urlValidation'

/**
 * Check if URL is a known image hosting domain
 */
function isKnownImageHost(url) {
  const knownHosts = [
    'pbs.twimg.com',      // Twitter images
    'i.imgur.com',        // Imgur
    'i.redd.it',          // Reddit
    'preview.redd.it',    // Reddit previews
    'media.giphy.com',    // Giphy
    'placekitten.com',    // Placeholder
    'picsum.photos',      // Lorem Picsum
  ]
  try {
    const hostname = new URL(url).hostname
    return knownHosts.some(host => hostname.includes(host))
  } catch {
    return false
  }
}

/**
 * Extract media from a direct URL
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function extractDirectMedia(url) {
  // SECURITY: Validate URL before fetching
  // Allow any HTTPS for direct image URLs (they're explicitly user-provided)
  const validation = validateUrl(url, { allowAnyHttps: true })
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.error}`)
  }

  // For known image hosts, skip HEAD check and trust the URL
  if (isKnownImageHost(url)) {
    return [{
      mediaUrl: url,
      mediaType: guessMediaType(url),
      metadata: {
        source: 'direct-trusted',
        note: 'Known image hosting domain',
      }
    }]
  }

  try {
    // Validate the URL is accessible
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
    })

    if (!response.ok) {
      throw new Error(`URL returned ${response.status}`)
    }

    // Check content type
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length')

    let mediaType = 'image'

    if (contentType.includes('video') || url.match(/\.(mp4|webm|mov)$/i)) {
      mediaType = 'video'
    } else if (contentType.includes('gif') || url.match(/\.gif$/i)) {
      mediaType = 'gif'
    } else if (!contentType.includes('image') && !isImageUrl(url)) {
      throw new Error('URL does not appear to be an image or video')
    }

    return [{
      mediaUrl: url,
      mediaType,
      metadata: {
        contentType,
        contentLength: contentLength ? parseInt(contentLength) : null,
        source: 'direct',
      }
    }]

  } catch (error) {
    // If HEAD fails due to CORS or network error, still return the URL
    // The browser may be able to load it in an img tag
    if (error.message.includes('CORS') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch')) {
      return [{
        mediaUrl: url,
        mediaType: guessMediaType(url),
        metadata: {
          source: 'direct-unverified',
          note: 'Could not verify URL due to CORS restrictions',
        }
      }]
    }

    throw new Error(`Direct URL extraction failed: ${error.message}`)
  }
}

function isImageUrl(url) {
  // Check file extensions
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)) {
    return true
  }
  // Check for format query param (Twitter style: ?format=jpg)
  if (/[?&]format=(jpg|jpeg|png|gif|webp)/i.test(url)) {
    return true
  }
  return false
}

function guessMediaType(url) {
  if (/\.gif(\?.*)?$/i.test(url) || /[?&]format=gif/i.test(url)) return 'gif'
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) return 'video'
  return 'image'
}
