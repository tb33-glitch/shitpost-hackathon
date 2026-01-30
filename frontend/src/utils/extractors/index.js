/**
 * Media Extraction API
 * Uses backend server for extraction (no CORS issues!)
 */

const API_BASE = '/api/scraper'

/**
 * Extract media from a URL via backend API
 * @param {string} url - The URL to extract media from
 * @returns {Promise<Array<{mediaUrl: string, mediaType: string, metadata: object}>>}
 */
export async function extractMedia(url) {
  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Extraction failed')
  }

  return data.media
}

/**
 * Extract media from multiple URLs via backend API
 * @param {string[]} urls - Array of URLs to extract
 * @returns {Promise<{total: number, success: number, failed: number, results: Array}>}
 */
export async function extractMediaBatch(urls) {
  const response = await fetch(`${API_BASE}/extract-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  })

  return await response.json()
}

/**
 * Detect the type of URL (for display purposes)
 * @param {string} url
 * @returns {string}
 */
export function detectUrlType(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Direct image CDNs
    const directImageHosts = [
      'pbs.twimg.com',
      'i.redd.it',
      'preview.redd.it',
      'i.imgur.com',
      'media.giphy.com',
    ]
    if (directImageHosts.some(host => hostname.includes(host))) {
      return 'direct'
    }

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter'
    }
    if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
      return 'reddit'
    }
    if (hostname.includes('imgur.com')) {
      return 'imgur'
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }

    // Check for direct image URLs by extension
    const path = urlObj.pathname.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp|mp4|webm)(\?.*)?$/i.test(path)) {
      return 'direct'
    }

    return 'unknown'
  } catch {
    return 'invalid'
  }
}
