/**
 * URL validation utilities
 *
 * Used to validate URLs before making external requests.
 * Helps prevent SSRF and other URL-based attacks.
 */

// Allowed domains for media extraction
const ALLOWED_DOMAINS = [
  // Social media
  'twitter.com',
  'x.com',
  'reddit.com',
  'redd.it',
  'imgur.com',
  'i.imgur.com',
  'youtube.com',
  'youtu.be',
  'i.redd.it',
  'v.redd.it',
  'preview.redd.it',

  // CDNs and image hosts
  'pbs.twimg.com',
  'video.twimg.com',
  'abs.twimg.com',
  'ton.twimg.com',

  // Nitter instances (Twitter proxies)
  'nitter.net',
  'nitter.poast.org',
  'nitter.privacydev.net',

  // Proxies for CORS bypass
  'fxtwitter.com',
  'vxtwitter.com',
  'api.fxtwitter.com',
  'rxddit.com',
]

// Blocked domains (internal networks, etc)
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
]

/**
 * Check if a URL is safe to fetch from
 * @param {string} urlString - URL to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowAnyHttps - Allow any HTTPS domain (for direct image URLs)
 * @returns {{ valid: boolean, error?: string, url?: URL }}
 */
export function validateUrl(urlString, options = {}) {
  const { allowAnyHttps = false } = options

  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Invalid URL' }
  }

  let url
  try {
    url = new URL(urlString)
  } catch {
    return { valid: false, error: 'Malformed URL' }
  }

  // Only allow HTTP(S)
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' }
  }

  // Check for blocked patterns (internal networks)
  const hostname = url.hostname.toLowerCase()
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal network URLs are not allowed' }
    }
  }

  // For direct image URLs, allow any HTTPS domain
  if (allowAnyHttps && url.protocol === 'https:') {
    return { valid: true, url }
  }

  // Check against allowed domains
  const isAllowed = ALLOWED_DOMAINS.some(domain => {
    return hostname === domain || hostname.endsWith('.' + domain)
  })

  if (!isAllowed) {
    return { valid: false, error: `Domain not allowed: ${hostname}` }
  }

  return { valid: true, url }
}

/**
 * Check if URL points to an image file
 * @param {string} urlString - URL to check
 * @returns {boolean}
 */
export function isImageUrl(urlString) {
  try {
    const url = new URL(urlString)
    const path = url.pathname.toLowerCase()
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/.test(path)
  } catch {
    return false
  }
}

/**
 * Check if URL points to a video file
 * @param {string} urlString - URL to check
 * @returns {boolean}
 */
export function isVideoUrl(urlString) {
  try {
    const url = new URL(urlString)
    const path = url.pathname.toLowerCase()
    return /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/.test(path)
  } catch {
    return false
  }
}

/**
 * Video hosting domains that indicate video content
 */
const VIDEO_HOSTING_DOMAINS = [
  'video.twimg.com',      // Twitter video CDN
  'v.redd.it',            // Reddit video hosting
  'redgifs.com',          // RedGIFs
  'gfycat.com',           // Gfycat
  'streamable.com',       // Streamable
  'clips.twitch.tv',      // Twitch clips
]

/**
 * Video file extensions
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.gifv']

/**
 * Comprehensive check if a media item is a video
 * Works with both URL strings and media item objects
 *
 * @param {string|object} item - URL string or media item object with mediaUrl/mediaType
 * @returns {boolean}
 */
export function isVideoContent(item) {
  // Handle object with mediaType property
  if (item && typeof item === 'object') {
    // Explicit mediaType takes priority
    if (item.mediaType === 'video') return true
    if (item.mediaType === 'image') return false

    // Check the URL
    const url = item.mediaUrl || item.url || ''
    return isVideoContent(url)
  }

  // Handle string URL
  if (typeof item !== 'string' || !item) return false

  const urlLower = item.toLowerCase()

  // Check video hosting domains
  for (const domain of VIDEO_HOSTING_DOMAINS) {
    if (urlLower.includes(domain)) return true
  }

  // Check file extensions
  for (const ext of VIDEO_EXTENSIONS) {
    if (urlLower.includes(ext)) return true
  }

  return false
}

/**
 * Sanitize a URL for logging (hide sensitive query params)
 * @param {string} urlString - URL to sanitize
 * @returns {string}
 */
export function sanitizeUrlForLogging(urlString) {
  try {
    const url = new URL(urlString)
    // Remove sensitive query parameters
    const sensitiveParams = ['key', 'token', 'auth', 'secret', 'password', 'api_key', 'apikey']
    sensitiveParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '[REDACTED]')
      }
    })
    return url.toString()
  } catch {
    return '[Invalid URL]'
  }
}
