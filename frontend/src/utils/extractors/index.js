import { extractTwitterMedia } from './twitter'
import { extractRedditMedia } from './reddit'
import { extractImgurMedia } from './imgur'
import { extractYoutubeThumb } from './youtube'
import { extractDirectMedia } from './direct'

/**
 * Extract media from a URL based on its type
 * @param {string} url - The URL to extract media from
 * @param {string} type - The detected URL type (twitter, reddit, imgur, youtube, direct)
 * @returns {Promise<Array<{mediaUrl: string, mediaType: string, metadata: object}>>}
 */
export async function extractMedia(url, type) {
  switch (type) {
    case 'twitter':
      return extractTwitterMedia(url)
    case 'reddit':
      return extractRedditMedia(url)
    case 'imgur':
      return extractImgurMedia(url)
    case 'youtube':
      return extractYoutubeThumb(url)
    case 'direct':
      return extractDirectMedia(url)
    default:
      // Try direct extraction as fallback
      return extractDirectMedia(url)
  }
}

/**
 * Detect the type of URL
 * @param {string} url
 * @returns {string}
 */
export function detectUrlType(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Check for direct image CDN URLs first (before checking main domains)
    const directImageHosts = [
      'pbs.twimg.com',      // Twitter images
      'i.redd.it',          // Reddit images
      'preview.redd.it',    // Reddit previews
      'i.imgur.com',        // Imgur direct images
      'media.giphy.com',    // Giphy
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

    // Check for format query param (Twitter style)
    if (/[?&]format=(jpg|jpeg|png|gif|webp)/i.test(url)) {
      return 'direct'
    }

    return 'unknown'
  } catch {
    return 'invalid'
  }
}
