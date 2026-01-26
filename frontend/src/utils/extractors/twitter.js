/**
 * Extract media from Twitter/X URLs
 *
 * Supports both images and videos using multiple extraction methods:
 * 1. oEmbed API for images
 * 2. Third-party services (ssstwitter, twitsave) for videos
 * 3. Nitter instances as fallback
 */

const NITTER_INSTANCES = [
  'nitter.net',
  'nitter.it',
  'nitter.nl',
]

// CORS proxies to bypass browser restrictions
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

// Third-party video download services
const VIDEO_SERVICES = [
  {
    name: 'twitsave',
    getUrl: (tweetUrl) => `https://twitsave.com/info?url=${encodeURIComponent(tweetUrl)}`,
  },
  {
    name: 'ssstwitter',
    getUrl: (tweetUrl) => `https://ssstwitter.com/info?url=${encodeURIComponent(tweetUrl)}`,
  },
]

/**
 * Extract tweet ID from URL
 */
function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Normalize Twitter URL (handle x.com and twitter.com)
 */
function normalizeTwitterUrl(url) {
  return url.replace('x.com', 'twitter.com')
}

/**
 * Try fxtwitter/vxtwitter API for video extraction (often more reliable)
 */
async function tryFxTwitter(url, tweetId) {
  const fxUrl = url.replace('twitter.com', 'api.fxtwitter.com').replace('x.com', 'api.fxtwitter.com')

  try {
    console.log('[Twitter Video] Trying fxtwitter API:', fxUrl)
    const response = await fetch(fxUrl)

    if (response.ok) {
      const data = await response.json()
      console.log('[Twitter Video] fxtwitter response:', JSON.stringify(data).slice(0, 500))

      if (data.tweet?.media?.videos?.length > 0) {
        return data.tweet.media.videos.map(video => ({
          mediaUrl: video.url,
          mediaType: 'video',
          metadata: {
            tweetId,
            source: 'fxtwitter',
            author: data.tweet.author?.name,
            extractedAt: new Date().toISOString(),
          }
        }))
      }
    }
  } catch (e) {
    console.log('[Twitter Video] fxtwitter failed:', e.message)
  }

  return null
}

/**
 * Try to extract video using third-party services with CORS proxy
 */
async function tryVideoExtraction(url, tweetId) {
  // First try fxtwitter API (most reliable)
  const fxResults = await tryFxTwitter(url, tweetId)
  if (fxResults && fxResults.length > 0) {
    return fxResults
  }

  const normalizedUrl = normalizeTwitterUrl(url)

  // Try each video service with each CORS proxy
  for (const service of VIDEO_SERVICES) {
    const serviceUrl = service.getUrl(normalizedUrl)

    // First try direct (unlikely to work but fast)
    const urlsToTry = [
      serviceUrl,
      ...CORS_PROXIES.map(proxy => proxy(serviceUrl))
    ]

    for (const fetchUrl of urlsToTry) {
      try {
        console.log(`Trying ${service.name} via: ${fetchUrl.substring(0, 50)}...`)

        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/json',
          }
        })

        if (response.ok) {
          const html = await response.text()
          console.log(`[Twitter Video] ${service.name} response length:`, html.length)

          // Look for video URLs in the response
          // These services typically have download links with video.twimg.com URLs
          const videoMatches = html.match(/https:\/\/video\.twimg\.com\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi)
          console.log(`[Twitter Video] ${service.name} video matches:`, videoMatches?.length || 0)

          if (videoMatches && videoMatches.length > 0) {
            // Get unique URLs and clean them up
            const uniqueUrls = [...new Set(videoMatches.map(u =>
              u.replace(/&amp;/g, '&')
               .replace(/\\u002F/g, '/')
               .split('?')[0] + '?tag=12' // Simplify URL, keep basic query
            ))]

            console.log(`Found ${uniqueUrls.length} video URLs from ${service.name}`)

            return uniqueUrls.slice(0, 3).map(videoUrl => ({ // Limit to 3 quality options
              mediaUrl: videoUrl,
              mediaType: 'video',
              metadata: {
                tweetId,
                source: service.name,
                extractedAt: new Date().toISOString(),
              }
            }))
          }
        }
      } catch (e) {
        console.log(`${service.name} fetch failed:`, e.message)
      }
    }
  }

  return null
}

/**
 * Extract media from a Twitter/X URL
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function extractTwitterMedia(url) {
  console.log('[Twitter Extractor] Starting extraction for:', url)
  const tweetId = extractTweetId(url)

  if (!tweetId) {
    throw new Error('Could not extract tweet ID from URL')
  }

  console.log('[Twitter Extractor] Tweet ID:', tweetId)
  const results = []
  let oembedData = null

  // Try oEmbed first for images and metadata
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl)

    if (response.ok) {
      oembedData = await response.json()

      // oEmbed returns HTML, we need to parse for images
      const imgMatches = oembedData.html.match(/https:\/\/pbs\.twimg\.com\/media\/[^"'\s]+/g)

      if (imgMatches && imgMatches.length > 0) {
        results.push(...imgMatches.map(imgUrl => ({
          mediaUrl: imgUrl.replace(/&amp;/g, '&'),
          mediaType: 'image',
          metadata: {
            tweetId,
            author: oembedData.author_name,
            authorUrl: oembedData.author_url,
          }
        })))
      }
    }
  } catch (e) {
    console.log('oEmbed extraction failed:', e.message)
  }

  // Try video extraction using third-party services
  console.log('[Twitter Extractor] Attempting video extraction...')
  try {
    const videoResults = await tryVideoExtraction(url, tweetId)
    console.log('[Twitter Extractor] Video extraction result:', videoResults?.length || 0, 'videos found')
    if (videoResults && videoResults.length > 0) {
      // Add author info from oEmbed if available
      videoResults.forEach(v => {
        if (oembedData) {
          v.metadata.author = oembedData.author_name
          v.metadata.authorUrl = oembedData.author_url
        }
      })
      results.push(...videoResults)
    }
  } catch (e) {
    console.log('Video extraction failed:', e.message)
  }

  // If we got results, return them
  if (results.length > 0) {
    return results
  }

  // Try Nitter instances as fallback for images
  for (const instance of NITTER_INSTANCES) {
    try {
      const nitterUrl = url
        .replace('twitter.com', instance)
        .replace('x.com', instance)

      const response = await fetch(nitterUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; bot)',
        }
      })

      if (response.ok) {
        const html = await response.text()

        // Extract image URLs from Nitter HTML
        const imgMatches = html.match(/\/pic\/[^"'\s]+/g)

        if (imgMatches && imgMatches.length > 0) {
          return imgMatches.map(path => ({
            mediaUrl: `https://${instance}${path}`,
            mediaType: 'image',
            metadata: { tweetId, source: 'nitter' }
          }))
        }
      }
    } catch (e) {
      console.log(`Nitter (${instance}) extraction failed:`, e.message)
    }
  }

  // If all automatic methods fail, provide manual instructions with video helper
  throw new Error(
    'Automatic extraction failed (likely due to CORS restrictions).\n\n' +
    'For VIDEOS: Visit twitsave.com or ssstwitter.com, paste the tweet URL, ' +
    'then copy the direct video URL and paste it here.\n\n' +
    'For IMAGES: Right-click the image on Twitter → Copy image address → Paste that URL.'
  )
}
