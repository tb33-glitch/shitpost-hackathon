/**
 * Extract media from Reddit URLs
 *
 * Reddit provides a JSON API by appending .json to post URLs
 */

/**
 * Extract media from a Reddit URL
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function extractRedditMedia(url) {
  try {
    // Convert URL to JSON endpoint
    let jsonUrl = url

    // Handle different Reddit URL formats
    if (url.includes('redd.it/')) {
      // Short URL - expand it first
      const response = await fetch(url, { redirect: 'follow' })
      jsonUrl = response.url
    }

    // Remove trailing slash and query params, add .json
    jsonUrl = jsonUrl.split('?')[0].replace(/\/$/, '') + '.json'

    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'shitpost.pro media extractor (contact: admin@shitpost.pro)'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`)
    }

    const data = await response.json()

    // Reddit returns an array, first element is post data
    const post = data[0]?.data?.children?.[0]?.data

    if (!post) {
      throw new Error('Could not parse Reddit response')
    }

    const results = []

    // Check for direct image
    if (post.url && isImageUrl(post.url)) {
      results.push({
        mediaUrl: post.url,
        mediaType: 'image',
        metadata: {
          title: post.title,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          permalink: `https://reddit.com${post.permalink}`,
        }
      })
    }

    // Check for Reddit-hosted image
    if (post.url_overridden_by_dest && isImageUrl(post.url_overridden_by_dest)) {
      results.push({
        mediaUrl: post.url_overridden_by_dest,
        mediaType: 'image',
        metadata: {
          title: post.title,
          subreddit: post.subreddit,
          author: post.author,
        }
      })
    }

    // Check preview images
    if (post.preview?.images) {
      for (const image of post.preview.images) {
        // Get the source (highest quality)
        if (image.source?.url) {
          const imgUrl = decodeHtmlEntities(image.source.url)
          if (!results.some(r => r.mediaUrl === imgUrl)) {
            results.push({
              mediaUrl: imgUrl,
              mediaType: 'image',
              metadata: {
                title: post.title,
                subreddit: post.subreddit,
                author: post.author,
                width: image.source.width,
                height: image.source.height,
              }
            })
          }
        }

        // Check for GIF variant
        if (image.variants?.gif?.source?.url) {
          results.push({
            mediaUrl: decodeHtmlEntities(image.variants.gif.source.url),
            mediaType: 'gif',
            metadata: {
              title: post.title,
              subreddit: post.subreddit,
            }
          })
        }

        // Check for MP4 variant
        if (image.variants?.mp4?.source?.url) {
          results.push({
            mediaUrl: decodeHtmlEntities(image.variants.mp4.source.url),
            mediaType: 'video',
            metadata: {
              title: post.title,
              subreddit: post.subreddit,
            }
          })
        }
      }
    }

    // Check for Reddit video
    if (post.media?.reddit_video?.fallback_url) {
      results.push({
        mediaUrl: post.media.reddit_video.fallback_url,
        mediaType: 'video',
        metadata: {
          title: post.title,
          subreddit: post.subreddit,
          duration: post.media.reddit_video.duration,
          width: post.media.reddit_video.width,
          height: post.media.reddit_video.height,
        }
      })
    }

    // Check gallery data
    if (post.gallery_data?.items && post.media_metadata) {
      for (const item of post.gallery_data.items) {
        const media = post.media_metadata[item.media_id]
        if (media?.s?.u) {
          results.push({
            mediaUrl: decodeHtmlEntities(media.s.u),
            mediaType: media.e === 'AnimatedImage' ? 'gif' : 'image',
            metadata: {
              title: post.title,
              subreddit: post.subreddit,
              galleryIndex: post.gallery_data.items.indexOf(item),
            }
          })
        }
      }
    }

    if (results.length === 0) {
      throw new Error('No media found in Reddit post')
    }

    return results

  } catch (error) {
    if (error.message.includes('No media found')) {
      throw error
    }
    throw new Error(`Reddit extraction failed: ${error.message}`)
  }
}

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) ||
    url.includes('i.redd.it') ||
    url.includes('i.imgur.com')
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}
