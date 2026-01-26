/**
 * IPFS utilities for Pinata uploads
 *
 * SECURITY WARNING: The Pinata JWT is exposed in the browser bundle.
 * For production, move these uploads to a backend API that holds the JWT server-side.
 *
 * Current mitigations:
 * - Rate limiting (max 10 uploads per minute per session)
 * - JWT must be explicitly configured (no defaults)
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

// Rate limiting: max uploads per minute
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const uploadTimestamps = []

function checkRateLimit() {
  const now = Date.now()
  // Remove timestamps outside the window
  while (uploadTimestamps.length > 0 && uploadTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    uploadTimestamps.shift()
  }

  if (uploadTimestamps.length >= RATE_LIMIT_MAX) {
    const waitTime = Math.ceil((uploadTimestamps[0] + RATE_LIMIT_WINDOW - now) / 1000)
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before uploading again.`)
  }

  uploadTimestamps.push(now)
}

function validatePinataConfig() {
  if (!PINATA_JWT) {
    throw new Error(
      'Pinata JWT not configured. Please add VITE_PINATA_JWT to your .env file.\n' +
      'Get a free API key at https://app.pinata.cloud/developers/api-keys'
    )
  }

  // Basic JWT format validation (should be 3 dot-separated parts)
  const parts = PINATA_JWT.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid Pinata JWT format. Please check your VITE_PINATA_JWT value.')
  }
}

// Upload image blob to Pinata
export async function uploadImage(blob, filename = 'artwork.png') {
  validatePinataConfig()
  checkRateLimit()

  const formData = new FormData()
  formData.append('file', blob, filename)

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    // Don't expose full error which might contain sensitive info
    if (response.status === 401) {
      throw new Error('Pinata authentication failed. Please check your API key.')
    }
    if (response.status === 429) {
      throw new Error('Pinata rate limit exceeded. Please try again later.')
    }
    throw new Error(`Failed to upload image (${response.status})`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

// Upload metadata JSON to Pinata
export async function uploadMetadata(metadata) {
  validatePinataConfig()
  checkRateLimit()

  // Sanitize metadata - remove any potentially sensitive fields
  const sanitizedMetadata = {
    name: String(metadata.name || '').slice(0, 100),
    description: String(metadata.description || '').slice(0, 500),
    image: metadata.image,
    external_url: metadata.external_url,
    attributes: Array.isArray(metadata.attributes) ? metadata.attributes.slice(0, 20) : [],
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
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
    if (response.status === 401) {
      throw new Error('Pinata authentication failed. Please check your API key.')
    }
    if (response.status === 429) {
      throw new Error('Pinata rate limit exceeded. Please try again later.')
    }
    throw new Error(`Failed to upload metadata (${response.status})`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

// Generate NFT metadata
export function generateMetadata(imageIpfsUrl, tokenId) {
  return {
    name: `shitpost #${tokenId}`,
    description: 'A professional shitpost minted on shitpost.pro',
    image: imageIpfsUrl,
    external_url: 'https://shitpost.pro',
    attributes: [
      {
        trait_type: 'Canvas Size',
        value: '1080x1080',
      },
      {
        display_type: 'date',
        trait_type: 'Created',
        value: Math.floor(Date.now() / 1000),
      },
    ],
  }
}

// Fetch metadata from IPFS
export async function fetchMetadata(ipfsUrl) {
  const url = ipfsUrl.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch metadata')
  }

  try {
    return await response.json()
  } catch (parseError) {
    throw new Error('Failed to parse metadata JSON')
  }
}

// Convert IPFS URL to gateway URL
export function ipfsToGateway(ipfsUrl) {
  if (!ipfsUrl) return ''
  return ipfsUrl.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`)
}

// Check if Pinata is configured (for UI to show appropriate messages)
export function isPinataConfigured() {
  return !!PINATA_JWT
}
