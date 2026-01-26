/**
 * Extract thumbnails from YouTube URLs
 *
 * YouTube video thumbnails are publicly accessible at predictable URLs
 */

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  try {
    const urlObj = new URL(url)

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('/')[0]
    }

    // youtube.com/embed/VIDEO_ID (check before generic youtube.com)
    if (urlObj.pathname.includes('/embed/')) {
      return urlObj.pathname.split('/embed/')[1].split('/')[0].split('?')[0]
    }

    // youtube.com/v/VIDEO_ID (check before generic youtube.com)
    if (urlObj.pathname.includes('/v/')) {
      return urlObj.pathname.split('/v/')[1].split('/')[0].split('?')[0]
    }

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v')
    }

    return null
  } catch {
    return null
  }
}

/**
 * Extract thumbnail from a YouTube URL
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function extractYoutubeThumb(url) {
  const videoId = extractVideoId(url)

  if (!videoId) {
    throw new Error('Could not extract YouTube video ID')
  }

  // YouTube thumbnail URL patterns (in order of quality)
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,  // 1920x1080
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,     // 640x480
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,     // 480x360
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,     // 320x180
    `https://img.youtube.com/vi/${videoId}/default.jpg`,       // 120x90
  ]

  const results = []

  // Try to get the highest quality available
  for (const thumbUrl of thumbnailUrls) {
    try {
      const response = await fetch(thumbUrl, { method: 'HEAD' })

      if (response.ok) {
        // Check if it's not a placeholder (YouTube returns 404 placeholder for missing maxres)
        const contentLength = response.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > 1000) {
          results.push({
            mediaUrl: thumbUrl,
            mediaType: 'image',
            metadata: {
              videoId,
              quality: getQualityName(thumbUrl),
              source: 'youtube-thumbnail',
              videoUrl: url,
            }
          })
          break // Only get the best quality
        }
      }
    } catch {
      continue
    }
  }

  // If no high-quality found, add the default
  if (results.length === 0) {
    results.push({
      mediaUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      mediaType: 'image',
      metadata: {
        videoId,
        quality: 'hq',
        source: 'youtube-thumbnail',
        videoUrl: url,
      }
    })
  }

  // Also offer to get all quality variants
  const allQualities = thumbnailUrls.slice(1).map(thumbUrl => ({
    mediaUrl: thumbUrl,
    mediaType: 'image',
    metadata: {
      videoId,
      quality: getQualityName(thumbUrl),
      source: 'youtube-thumbnail-alt',
    }
  }))

  // Just return the best one for now
  return results
}

function getQualityName(url) {
  if (url.includes('maxresdefault')) return 'maxres (1920x1080)'
  if (url.includes('sddefault')) return 'sd (640x480)'
  if (url.includes('hqdefault')) return 'hq (480x360)'
  if (url.includes('mqdefault')) return 'mq (320x180)'
  return 'default (120x90)'
}
