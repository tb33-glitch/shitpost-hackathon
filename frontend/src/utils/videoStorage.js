/**
 * Video Storage - Store extracted videos in IndexedDB for use in MemeStudio
 *
 * IndexedDB can store large files (hundreds of MB) unlike localStorage.
 * Videos are stored as Blobs and can be loaded without CORS issues.
 */

const DB_NAME = 'shitpost-video-library'
const DB_VERSION = 1
const STORE_NAME = 'videos'

let dbPromise = null
let dbInstance = null

/**
 * Open/create the IndexedDB database
 * Handles connection recovery if the database connection is closed
 */
function openDB() {
  // Check if existing connection is still valid
  if (dbInstance) {
    try {
      // Test if the connection is still alive by checking objectStoreNames
      if (dbInstance.objectStoreNames.contains(STORE_NAME)) {
        return Promise.resolve(dbInstance)
      }
    } catch (e) {
      // Connection is dead, reset and reconnect
      console.log('[VideoStorage] Database connection stale, reconnecting...')
      dbInstance = null
      dbPromise = null
    }
  }

  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('[VideoStorage] Failed to open database:', request.error)
      dbPromise = null
      reject(request.error)
    }

    request.onsuccess = () => {
      console.log('[VideoStorage] Database opened successfully')
      dbInstance = request.result

      // Handle connection close events
      dbInstance.onclose = () => {
        console.log('[VideoStorage] Database connection closed')
        dbInstance = null
        dbPromise = null
      }

      dbInstance.onerror = (event) => {
        console.error('[VideoStorage] Database error:', event.target.error)
      }

      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('sourceUrl', 'sourceUrl', { unique: false })
        store.createIndex('addedAt', 'addedAt', { unique: false })
        console.log('[VideoStorage] Created object store')
      }
    }
  })

  return dbPromise
}

/**
 * Try to download video using cobalt.tools API
 * Cobalt handles Twitter/YouTube/etc video downloads with proper CORS
 */
async function tryCobaltDownload(url) {
  // Multiple cobalt instances to try
  const COBALT_APIS = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt-api.ggtyler.dev/api/json',
  ]

  for (const apiUrl of COBALT_APIS) {
    try {
      console.log('[VideoStorage] Trying cobalt API:', apiUrl, 'for:', url.slice(0, 60))

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          vCodec: 'h264',
          vQuality: '720',
          aFormat: 'mp3',
          filenamePattern: 'basic',
          isAudioOnly: false,
          disableMetadata: true,
        })
      })

      if (!response.ok) {
        console.log('[VideoStorage] Cobalt API returned:', response.status)
        continue
      }

      const data = await response.json()
      console.log('[VideoStorage] Cobalt response:', data.status, data.url?.slice(0, 60))

      if (data.status === 'stream' || data.status === 'redirect') {
        // Cobalt returns a direct download URL
        const videoUrl = data.url
        console.log('[VideoStorage] Cobalt download URL:', videoUrl?.slice(0, 80))

        if (videoUrl) {
          const videoResponse = await fetch(videoUrl)
          if (videoResponse.ok) {
            const blob = await videoResponse.blob()
            console.log('[VideoStorage] Downloaded via cobalt:', blob.size, 'bytes')
            return blob
          }
        }
      } else if (data.status === 'picker' && data.picker?.length > 0) {
        // Multiple options available, pick the first video
        const videoOption = data.picker.find(p => p.type === 'video') || data.picker[0]
        if (videoOption?.url) {
          const videoResponse = await fetch(videoOption.url)
          if (videoResponse.ok) {
            const blob = await videoResponse.blob()
            console.log('[VideoStorage] Downloaded via cobalt picker:', blob.size, 'bytes')
            return blob
          }
        }
      } else if (data.status === 'error') {
        console.log('[VideoStorage] Cobalt error:', data.text || 'Unknown error')
      }
    } catch (e) {
      console.log('[VideoStorage] Cobalt download failed:', e.message)
    }
  }

  return null
}

/**
 * Try to get video via fxtwitter's CDN (they serve with CORS headers)
 */
async function tryFxTwitterCDN(sourceUrl) {
  if (!sourceUrl) return null

  // Extract tweet ID and username from URL
  const match = sourceUrl.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/)
  if (!match) return null

  const [, username, tweetId] = match

  // Try different fxtwitter URL patterns
  const fxUrls = [
    `https://d.fxtwitter.com/${username}/status/${tweetId}/video/1`,
    `https://d.vxtwitter.com/${username}/status/${tweetId}/video/1`,
  ]

  for (const fxUrl of fxUrls) {
    try {
      console.log('[VideoStorage] Trying fxtwitter CDN:', fxUrl)
      const response = await fetch(fxUrl, { redirect: 'follow' })

      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('video') || contentType.includes('octet-stream')) {
          const blob = await response.blob()
          if (blob.size > 10000) {
            console.log('[VideoStorage] Downloaded via fxtwitter CDN:', blob.size, 'bytes')
            return blob
          }
        }
      }
    } catch (e) {
      console.log('[VideoStorage] fxtwitter CDN failed:', e.message)
    }
  }

  return null
}

/**
 * Download a video from URL through multiple methods
 */
export async function downloadVideo(url, onProgress, sourceUrl = null) {
  // If we have a source Twitter URL, try fxtwitter CDN first (most reliable for Twitter)
  if (sourceUrl && (sourceUrl.includes('twitter.com') || sourceUrl.includes('x.com'))) {
    console.log('[VideoStorage] Trying fxtwitter CDN with source URL:', sourceUrl.slice(0, 60))
    const fxBlob = await tryFxTwitterCDN(sourceUrl)
    if (fxBlob) return fxBlob

    // Then try cobalt
    console.log('[VideoStorage] Trying cobalt with source tweet URL:', sourceUrl.slice(0, 60))
    const cobaltBlob = await tryCobaltDownload(sourceUrl)
    if (cobaltBlob) return cobaltBlob
  }

  // Also try cobalt with the direct video URL if it's a Twitter video
  if (url.includes('video.twimg.com')) {
    // For Twitter CDN URLs, we need the original tweet URL for cobalt
    // But we can still try cobalt with a reconstructed URL
    console.log('[VideoStorage] Twitter video detected, cobalt needs tweet URL')
  }

  const CORS_PROXIES = [
    // Try thingproxy which sometimes works better
    (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ]

  // Try direct first (might work for some URLs)
  const urlsToTry = [url, ...CORS_PROXIES.map(p => p(url))]

  for (const fetchUrl of urlsToTry) {
    try {
      console.log('[VideoStorage] Trying to download:', fetchUrl.slice(0, 80))

      const response = await fetch(fetchUrl)

      if (!response.ok) {
        console.log('[VideoStorage] Failed with status:', response.status)
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
        console.log('[VideoStorage] Not a video content-type:', contentType)
        // Continue anyway, might still be a video
      }

      const blob = await response.blob()
      console.log('[VideoStorage] Downloaded video:', blob.size, 'bytes')

      // Validate it's actually a video (check size)
      if (blob.size < 10000) {
        console.log('[VideoStorage] Blob too small, likely not a video')
        continue
      }

      return blob
    } catch (e) {
      console.log('[VideoStorage] Download failed:', e.message)
    }
  }

  throw new Error('Failed to download video from all sources')
}

/**
 * Save a video to IndexedDB
 */
export async function saveVideo(metadata, blob) {
  console.log('[VideoStorage] saveVideo called with:', {
    id: metadata.id,
    name: metadata.name,
    blobSize: blob?.size,
    blobType: blob?.type,
  })

  if (!blob || !(blob instanceof Blob)) {
    console.error('[VideoStorage] Invalid blob provided:', blob)
    throw new Error('Invalid blob provided to saveVideo')
  }

  let db
  try {
    db = await openDB()
    console.log('[VideoStorage] Database connection obtained')
  } catch (e) {
    console.error('[VideoStorage] Failed to open database:', e)
    throw e
  }

  const video = {
    id: metadata.id || `video-${Date.now()}`,
    blob: blob,
    sourceUrl: metadata.sourceUrl,
    mediaUrl: metadata.mediaUrl,
    name: metadata.name || metadata.tags?.[0] || 'Untitled Video',
    tags: metadata.tags || [],
    duration: metadata.duration || null,
    size: blob.size,
    mimeType: blob.type || 'video/mp4',
    addedAt: new Date().toISOString(),
    source: metadata.source || 'admin',
  }

  return new Promise((resolve, reject) => {
    let transaction
    try {
      transaction = db.transaction([STORE_NAME], 'readwrite')
    } catch (e) {
      console.error('[VideoStorage] Failed to create transaction:', e)
      // Reset connection and retry
      dbInstance = null
      dbPromise = null
      reject(e)
      return
    }

    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(video)

    transaction.oncomplete = () => {
      console.log('[VideoStorage] Transaction completed successfully for:', video.id)
    }

    transaction.onabort = () => {
      console.error('[VideoStorage] Transaction aborted for:', video.id)
      reject(new Error('Transaction aborted'))
    }

    transaction.onerror = (event) => {
      console.error('[VideoStorage] Transaction error:', event.target.error)
      reject(event.target.error)
    }

    request.onsuccess = () => {
      console.log('[VideoStorage] Saved video:', video.id, 'size:', video.size)
      resolve(video)
    }

    request.onerror = () => {
      console.error('[VideoStorage] Failed to save video:', request.error)
      reject(request.error)
    }
  })
}

/**
 * Get a video from IndexedDB by ID
 */
export async function getVideo(id) {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Get all videos from IndexedDB
 */
export async function getAllVideos() {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const videos = request.result || []
      console.log('[VideoStorage] Loaded', videos.length, 'videos from library')
      resolve(videos)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Delete a video from IndexedDB
 */
export async function deleteVideo(id) {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      console.log('[VideoStorage] Deleted video:', id)
      resolve(true)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Clear all videos from IndexedDB
 */
export async function clearAllVideos() {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => {
      console.log('[VideoStorage] Cleared all videos')
      resolve(true)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Create an object URL for a video (for use in <video> element)
 * Remember to call URL.revokeObjectURL() when done!
 */
export function createVideoURL(video) {
  if (!video?.blob) {
    console.error('[VideoStorage] No blob in video object')
    return null
  }
  return URL.createObjectURL(video.blob)
}

/**
 * Get video library stats
 */
export async function getLibraryStats() {
  const videos = await getAllVideos()
  const totalSize = videos.reduce((sum, v) => sum + (v.size || 0), 0)

  return {
    count: videos.length,
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
  }
}

export default {
  downloadVideo,
  saveVideo,
  getVideo,
  getAllVideos,
  deleteVideo,
  clearAllVideos,
  createVideoURL,
  getLibraryStats,
}
