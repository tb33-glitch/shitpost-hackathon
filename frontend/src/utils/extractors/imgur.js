/**
 * Extract media from Imgur URLs
 *
 * Imgur has various URL formats:
 * - https://imgur.com/a/ABC123 (album)
 * - https://imgur.com/gallery/ABC123 (gallery)
 * - https://imgur.com/ABC123 (single image)
 * - https://i.imgur.com/ABC123.jpg (direct image)
 */

/**
 * Extract media from an Imgur URL
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function extractImgurMedia(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const pathname = urlObj.pathname

    // Direct image URL (i.imgur.com)
    if (hostname === 'i.imgur.com') {
      return [{
        mediaUrl: url,
        mediaType: getMediaType(url),
        metadata: { source: 'imgur-direct' }
      }]
    }

    // Parse path to determine type
    const pathParts = pathname.split('/').filter(Boolean)

    if (pathParts.length === 0) {
      throw new Error('Invalid Imgur URL')
    }

    // Album or gallery
    if (pathParts[0] === 'a' || pathParts[0] === 'gallery') {
      const albumId = pathParts[1]
      return await extractAlbum(albumId)
    }

    // Single image (imgur.com/ABC123)
    const imageId = pathParts[0].split('.')[0] // Remove extension if present
    return await extractSingleImage(imageId)

  } catch (error) {
    throw new Error(`Imgur extraction failed: ${error.message}`)
  }
}

async function extractAlbum(albumId) {
  // Try to fetch album page and parse
  try {
    const response = await fetch(`https://imgur.com/a/${albumId}`)

    if (!response.ok) {
      throw new Error(`Album not found: ${response.status}`)
    }

    const html = await response.text()

    // Try to extract from embedded JSON data
    const jsonMatch = html.match(/image\s*:\s*({[\s\S]*?})\s*,\s*album/)
    const albumMatch = html.match(/album\s*:\s*({[\s\S]*?})\s*,/)

    // Extract image IDs from the page
    const imageIds = []
    const idMatches = html.matchAll(/{"id":"([a-zA-Z0-9]+)",".*?"ext":"(\.[a-z]+)"/g)

    for (const match of idMatches) {
      imageIds.push({
        id: match[1],
        ext: match[2]
      })
    }

    // Fallback: look for image URLs in the HTML
    if (imageIds.length === 0) {
      const imgMatches = html.matchAll(/https:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)(\.[a-z]+)/g)
      const seen = new Set()

      for (const match of imgMatches) {
        const key = match[1]
        if (!seen.has(key)) {
          seen.add(key)
          imageIds.push({
            id: match[1],
            ext: match[2]
          })
        }
      }
    }

    if (imageIds.length === 0) {
      throw new Error('No images found in album')
    }

    return imageIds.map((img, index) => ({
      mediaUrl: `https://i.imgur.com/${img.id}${img.ext}`,
      mediaType: getMediaType(img.ext),
      metadata: {
        albumId,
        index,
        source: 'imgur-album'
      }
    }))

  } catch (error) {
    // If HTML parsing fails, try constructing common URL patterns
    console.log('Album HTML parsing failed, trying fallback:', error.message)

    // Try common extensions
    const extensions = ['.jpg', '.png', '.gif', '.mp4']

    for (const ext of extensions) {
      const testUrl = `https://i.imgur.com/${albumId}${ext}`
      try {
        const response = await fetch(testUrl, { method: 'HEAD' })
        if (response.ok) {
          return [{
            mediaUrl: testUrl,
            mediaType: getMediaType(ext),
            metadata: { source: 'imgur-fallback' }
          }]
        }
      } catch {
        continue
      }
    }

    throw new Error('Could not extract album images')
  }
}

async function extractSingleImage(imageId) {
  // Try common extensions in order of likelihood
  const extensions = ['.jpg', '.png', '.gif', '.mp4', '.webp']

  for (const ext of extensions) {
    const testUrl = `https://i.imgur.com/${imageId}${ext}`
    try {
      const response = await fetch(testUrl, { method: 'HEAD' })
      if (response.ok) {
        return [{
          mediaUrl: testUrl,
          mediaType: getMediaType(ext),
          metadata: {
            imageId,
            source: 'imgur-single'
          }
        }]
      }
    } catch {
      continue
    }
  }

  // If HEAD requests fail, just try jpg as default
  return [{
    mediaUrl: `https://i.imgur.com/${imageId}.jpg`,
    mediaType: 'image',
    metadata: {
      imageId,
      source: 'imgur-guess'
    }
  }]
}

function getMediaType(urlOrExt) {
  const ext = urlOrExt.toLowerCase()
  if (ext.includes('.gif') || ext.includes('.gifv')) return 'gif'
  if (ext.includes('.mp4') || ext.includes('.webm')) return 'video'
  return 'image'
}
