/**
 * Pinata IPFS Service
 * Server-side wrapper for Pinata API - JWT never exposed to browser
 */

const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_JWT = process.env.PINATA_JWT
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validate Pinata configuration
 */
export function validateConfig() {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT environment variable is not configured')
  }
  const parts = PINATA_JWT.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid PINATA_JWT format')
  }
}

/**
 * Upload an image file to Pinata IPFS
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadImage(buffer, filename, mimetype) {
  validateConfig()

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    throw new Error(`Invalid file type: ${mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`)
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  const formData = new FormData()
  const blob = new Blob([buffer], { type: mimetype })
  formData.append('file', blob, filename)

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Pinata upload error:', errorText)

    if (response.status === 401) {
      throw new Error('Pinata authentication failed')
    }
    if (response.status === 429) {
      throw new Error('Pinata rate limit exceeded')
    }
    throw new Error(`Pinata upload failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

/**
 * Upload metadata JSON to Pinata IPFS
 * @param {object} metadata - NFT metadata object
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadMetadata(metadata) {
  validateConfig()

  // Sanitize metadata
  const sanitizedMetadata = {
    name: String(metadata.name || '').slice(0, 100),
    description: String(metadata.description || '').slice(0, 500),
    image: metadata.image,
    external_url: metadata.external_url,
    attributes: Array.isArray(metadata.attributes) ? metadata.attributes.slice(0, 20) : [],
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: sanitizedMetadata,
      pinataMetadata: {
        name: sanitizedMetadata.name || 'shitpost.pro metadata',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Pinata metadata upload error:', errorText)

    if (response.status === 401) {
      throw new Error('Pinata authentication failed')
    }
    if (response.status === 429) {
      throw new Error('Pinata rate limit exceeded')
    }
    throw new Error(`Pinata metadata upload failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

/**
 * Upload template metadata JSON to Pinata IPFS
 * @param {object} metadata - Template metadata object
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadTemplateMetadata(metadata) {
  validateConfig()

  // Sanitize template metadata
  const sanitizedMetadata = {
    name: String(metadata.name || '').slice(0, 50),
    category: String(metadata.category || 'templates').slice(0, 20),
    tags: Array.isArray(metadata.tags) ? metadata.tags.slice(0, 10).map(t => String(t).slice(0, 20)) : [],
    imageCid: metadata.imageCid,
    imageUrl: metadata.imageUrl,
    submittedBy: metadata.submittedBy,
    displayName: String(metadata.displayName || '').slice(0, 30),
    xp: typeof metadata.xp === 'number' ? metadata.xp : 10,
    submittedAt: metadata.submittedAt || new Date().toISOString(),
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: sanitizedMetadata,
      pinataMetadata: {
        name: `shitpost-template-${sanitizedMetadata.name}`,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Pinata template metadata upload error:', errorText)

    if (response.status === 401) {
      throw new Error('Pinata authentication failed')
    }
    if (response.status === 429) {
      throw new Error('Pinata rate limit exceeded')
    }
    throw new Error(`Pinata template metadata upload failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

export default {
  validateConfig,
  uploadImage,
  uploadMetadata,
  uploadTemplateMetadata,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
}
