/**
 * Scraper API Routes
 * Server-side media extraction from Twitter, Reddit, Imgur
 * No CORS restrictions on the backend!
 */

/**
 * Extract tweet ID from URL
 */
function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extract username from Twitter URL
 */
function extractTwitterUsername(url) {
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status/)
  return match ? match[1] : null
}

/**
 * Extract media from Twitter using fxtwitter API
 */
async function extractTwitter(url) {
  const tweetId = extractTweetId(url)
  const username = extractTwitterUsername(url)

  if (!tweetId) {
    throw new Error('Invalid Twitter URL - no tweet ID found')
  }

  // fxtwitter needs username/status/id format
  const fxUrl = `https://api.fxtwitter.com/${username || 'i'}/status/${tweetId}`

  console.log('[Scraper] Fetching Twitter:', fxUrl)

  try {
    const response = await fetch(fxUrl, {
      headers: {
        'User-Agent': 'shitpost-scraper/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.code === 404 || !data.tweet) {
      throw new Error('Tweet not found or is private')
    }

    const results = []

    // Extract images
    if (data.tweet?.media?.photos) {
      for (const photo of data.tweet.media.photos) {
        results.push({
          mediaUrl: photo.url,
          mediaType: 'image',
          metadata: {
            tweetId,
            author: data.tweet.author?.screen_name,
            authorName: data.tweet.author?.name,
            text: data.tweet.text?.substring(0, 100),
          }
        })
      }
    }

    // Extract videos
    if (data.tweet?.media?.videos) {
      for (const video of data.tweet.media.videos) {
        results.push({
          mediaUrl: video.url,
          mediaType: 'video',
          thumbnail: video.thumbnail_url,
          metadata: {
            tweetId,
            author: data.tweet.author?.screen_name,
            authorName: data.tweet.author?.name,
            duration: video.duration,
          }
        })
      }
    }

    // Fallback: check media.all array
    if (results.length === 0 && data.tweet?.media?.all) {
      for (const media of data.tweet.media.all) {
        results.push({
          mediaUrl: media.url,
          mediaType: media.type === 'video' ? 'video' : 'image',
          metadata: { tweetId }
        })
      }
    }

    if (results.length > 0) {
      return results
    }
  } catch (e) {
    console.log('[Scraper] fxtwitter failed:', e.message)
  }

  // Fallback: Try Twitter oEmbed for images
  try {
    console.log('[Scraper] Trying oEmbed fallback')
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl)

    if (response.ok) {
      const data = await response.json()
      const imgMatches = data.html?.match(/https:\/\/pbs\.twimg\.com\/media\/[^"'\s]+/g)

      if (imgMatches && imgMatches.length > 0) {
        return imgMatches.map(imgUrl => ({
          mediaUrl: imgUrl.replace(/&amp;/g, '&'),
          mediaType: 'image',
          metadata: {
            tweetId,
            author: data.author_name,
            source: 'oembed'
          }
        }))
      }
    }
  } catch (e) {
    console.log('[Scraper] oEmbed failed:', e.message)
  }

  throw new Error('Twitter extraction failed. Twitter has restricted API access. Try copying the image URL directly (right-click image → Copy image address) and paste that instead.')
}

/**
 * Extract media from Reddit using JSON API
 */
async function extractReddit(url) {
  // Convert URL to JSON endpoint
  let jsonUrl = url.split('?')[0].replace(/\/$/, '') + '.json'

  console.log('[Scraper] Fetching Reddit:', jsonUrl)
  const response = await fetch(jsonUrl, {
    headers: {
      'User-Agent': 'shitpost-scraper/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Reddit API returned ${response.status}`)
  }

  const data = await response.json()
  const post = data[0]?.data?.children?.[0]?.data

  if (!post) {
    throw new Error('Could not parse Reddit response')
  }

  const results = []
  const seen = new Set()

  // Helper to add unique results
  const addResult = (mediaUrl, mediaType, extra = {}) => {
    if (!seen.has(mediaUrl)) {
      seen.add(mediaUrl)
      results.push({
        mediaUrl: decodeHtmlEntities(mediaUrl),
        mediaType,
        metadata: {
          title: post.title,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          ...extra
        }
      })
    }
  }

  // Direct image URL
  if (post.url && isImageUrl(post.url)) {
    addResult(post.url, 'image')
  }

  // Reddit-hosted image
  if (post.url_overridden_by_dest && isImageUrl(post.url_overridden_by_dest)) {
    addResult(post.url_overridden_by_dest, 'image')
  }

  // Preview images (highest quality)
  if (post.preview?.images) {
    for (const image of post.preview.images) {
      if (image.source?.url) {
        addResult(image.source.url, 'image', {
          width: image.source.width,
          height: image.source.height
        })
      }
      // GIF variant
      if (image.variants?.gif?.source?.url) {
        addResult(image.variants.gif.source.url, 'gif')
      }
      // MP4 variant
      if (image.variants?.mp4?.source?.url) {
        addResult(image.variants.mp4.source.url, 'video')
      }
    }
  }

  // Reddit video
  if (post.media?.reddit_video?.fallback_url) {
    addResult(post.media.reddit_video.fallback_url, 'video', {
      duration: post.media.reddit_video.duration
    })
  }

  // Gallery
  if (post.gallery_data?.items && post.media_metadata) {
    for (const item of post.gallery_data.items) {
      const media = post.media_metadata[item.media_id]
      if (media?.s?.u) {
        addResult(media.s.u, media.e === 'AnimatedImage' ? 'gif' : 'image')
      }
    }
  }

  if (results.length === 0) {
    throw new Error('No media found in Reddit post')
  }

  return results
}

/**
 * Extract media from Imgur
 */
async function extractImgur(url) {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const pathParts = pathname.split('/').filter(Boolean)

  // Direct image (i.imgur.com)
  if (urlObj.hostname === 'i.imgur.com') {
    return [{
      mediaUrl: url,
      mediaType: getMediaType(url),
      metadata: { source: 'imgur-direct' }
    }]
  }

  // Album or gallery
  if (pathParts[0] === 'a' || pathParts[0] === 'gallery') {
    const albumId = pathParts[1]
    return await extractImgurAlbum(albumId)
  }

  // Single image
  const imageId = pathParts[0].split('.')[0]
  return await extractImgurSingle(imageId)
}

async function extractImgurAlbum(albumId) {
  console.log('[Scraper] Fetching Imgur album:', albumId)
  const response = await fetch(`https://imgur.com/a/${albumId}`)

  if (!response.ok) {
    throw new Error(`Imgur returned ${response.status}`)
  }

  const html = await response.text()
  const results = []
  const seen = new Set()

  // Extract image data from HTML
  const matches = html.matchAll(/{"id":"([a-zA-Z0-9]+)"[^}]*"ext":"(\.[a-z]+)"/g)
  for (const match of matches) {
    const id = match[1]
    const ext = match[2]
    if (!seen.has(id)) {
      seen.add(id)
      results.push({
        mediaUrl: `https://i.imgur.com/${id}${ext}`,
        mediaType: getMediaType(ext),
        metadata: { albumId, source: 'imgur-album' }
      })
    }
  }

  // Fallback: look for direct URLs
  if (results.length === 0) {
    const imgMatches = html.matchAll(/https:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)(\.[a-z]+)/g)
    for (const match of imgMatches) {
      const id = match[1]
      const ext = match[2]
      if (!seen.has(id)) {
        seen.add(id)
        results.push({
          mediaUrl: `https://i.imgur.com/${id}${ext}`,
          mediaType: getMediaType(ext),
          metadata: { albumId, source: 'imgur-album' }
        })
      }
    }
  }

  if (results.length === 0) {
    throw new Error('No images found in Imgur album')
  }

  return results
}

async function extractImgurSingle(imageId) {
  // Try common extensions
  const extensions = ['.jpg', '.png', '.gif', '.mp4', '.webp']

  for (const ext of extensions) {
    const testUrl = `https://i.imgur.com/${imageId}${ext}`
    try {
      const response = await fetch(testUrl, { method: 'HEAD' })
      if (response.ok) {
        return [{
          mediaUrl: testUrl,
          mediaType: getMediaType(ext),
          metadata: { imageId, source: 'imgur-single' }
        }]
      }
    } catch {
      continue
    }
  }

  // Default to jpg
  return [{
    mediaUrl: `https://i.imgur.com/${imageId}.jpg`,
    mediaType: 'image',
    metadata: { imageId, source: 'imgur-guess' }
  }]
}

/**
 * Extract from direct image URL
 */
async function extractDirect(url) {
  // Verify URL is accessible
  const response = await fetch(url, { method: 'HEAD' })

  if (!response.ok) {
    throw new Error(`URL returned ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  let mediaType = 'image'
  if (contentType.includes('video') || /\.(mp4|webm|mov)$/i.test(url)) {
    mediaType = 'video'
  } else if (contentType.includes('gif') || /\.gif$/i.test(url)) {
    mediaType = 'gif'
  }

  return [{
    mediaUrl: url,
    mediaType,
    metadata: { source: 'direct' }
  }]
}

// Helper functions
function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) ||
    url.includes('i.redd.it') ||
    url.includes('i.imgur.com') ||
    url.includes('pbs.twimg.com')
}

function getMediaType(urlOrExt) {
  const ext = urlOrExt.toLowerCase()
  if (ext.includes('.gif') || ext.includes('.gifv')) return 'gif'
  if (ext.includes('.mp4') || ext.includes('.webm')) return 'video'
  return 'image'
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

/**
 * Detect URL type
 */
function detectUrlType(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Direct image CDNs
    if (['pbs.twimg.com', 'i.redd.it', 'preview.redd.it', 'i.imgur.com'].some(h => hostname.includes(h))) {
      return 'direct'
    }

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter'
    if (hostname.includes('reddit.com') || hostname.includes('redd.it')) return 'reddit'
    if (hostname.includes('imgur.com')) return 'imgur'

    // Check extension
    if (/\.(jpg|jpeg|png|gif|webp|mp4|webm)(\?.*)?$/i.test(urlObj.pathname)) {
      return 'direct'
    }

    return 'unknown'
  } catch {
    return 'invalid'
  }
}

export default async function scraperRoutes(fastify, options) {
  // Extract media from a URL
  fastify.post('/extract', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (request, reply) => {
    const { url } = request.body
    const type = detectUrlType(url)

    fastify.log.info({ url, type }, 'Extracting media')

    try {
      let results
      switch (type) {
        case 'twitter':
          results = await extractTwitter(url)
          break
        case 'reddit':
          results = await extractReddit(url)
          break
        case 'imgur':
          results = await extractImgur(url)
          break
        case 'direct':
          results = await extractDirect(url)
          break
        default:
          // Try direct extraction as fallback
          results = await extractDirect(url)
      }

      return {
        success: true,
        url,
        type,
        media: results,
      }
    } catch (error) {
      fastify.log.error({ url, type, error: error.message }, 'Extraction failed')
      return reply.status(400).send({
        success: false,
        url,
        type,
        error: error.message,
      })
    }
  })

  // Batch extract multiple URLs
  fastify.post('/extract-batch', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['urls'],
        properties: {
          urls: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            maxItems: 20,
          },
        },
      },
    },
  }, async (request, reply) => {
    const { urls } = request.body

    fastify.log.info({ count: urls.length }, 'Batch extraction starting')

    const results = await Promise.all(
      urls.map(async (url) => {
        const type = detectUrlType(url)
        try {
          let media
          switch (type) {
            case 'twitter':
              media = await extractTwitter(url)
              break
            case 'reddit':
              media = await extractReddit(url)
              break
            case 'imgur':
              media = await extractImgur(url)
              break
            case 'direct':
              media = await extractDirect(url)
              break
            default:
              media = await extractDirect(url)
          }
          return { url, type, success: true, media }
        } catch (error) {
          return { url, type, success: false, error: error.message }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    fastify.log.info({ total: urls.length, success: successCount }, 'Batch extraction complete')

    return {
      total: urls.length,
      success: successCount,
      failed: urls.length - successCount,
      results,
    }
  })
}
