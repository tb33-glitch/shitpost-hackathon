/**
 * Backend API Client
 * Handles all communication with the secure backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Upload an image to IPFS via the backend
 * @param {Blob} blob - Image blob to upload
 * @param {string} filename - Filename for the upload
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadImage(blob, filename = 'artwork.png') {
  const formData = new FormData()
  formData.append('file', blob, filename)

  const response = await fetch(`${API_BASE_URL}/ipfs/upload-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))

    if (response.status === 429) {
      throw new Error(error.message || 'Rate limit exceeded. Please wait before uploading again.')
    }
    throw new Error(error.error || `Failed to upload image (${response.status})`)
  }

  return response.json()
}

/**
 * Upload NFT metadata to IPFS via the backend
 * @param {object} metadata - NFT metadata object
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadMetadata(metadata) {
  const response = await fetch(`${API_BASE_URL}/ipfs/upload-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))

    if (response.status === 429) {
      throw new Error(error.message || 'Rate limit exceeded. Please wait before uploading again.')
    }
    throw new Error(error.error || `Failed to upload metadata (${response.status})`)
  }

  return response.json()
}

/**
 * Upload a template image to IPFS via the backend
 * @param {File} file - Image file to upload
 * @param {string} templateName - Name of the template
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadTemplateImage(file, templateName) {
  const formData = new FormData()
  const sanitizedName = templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const extension = file.name.split('.').pop() || 'png'
  const filename = `template-${sanitizedName}-${Date.now()}.${extension}`

  formData.append('file', file, filename)

  const response = await fetch(`${API_BASE_URL}/ipfs/upload-template`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))

    if (response.status === 429) {
      throw new Error(error.message || 'Rate limit exceeded. Please wait before uploading again.')
    }
    throw new Error(error.error || `Failed to upload template image (${response.status})`)
  }

  return response.json()
}

/**
 * Upload template metadata to IPFS via the backend
 * @param {object} metadata - Template metadata object
 * @returns {Promise<{cid: string, url: string, gateway: string}>}
 */
export async function uploadTemplateMetadata(metadata) {
  const response = await fetch(`${API_BASE_URL}/ipfs/upload-template-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))

    if (response.status === 429) {
      throw new Error(error.message || 'Rate limit exceeded. Please wait before uploading again.')
    }
    throw new Error(error.error || `Failed to upload template metadata (${response.status})`)
  }

  return response.json()
}

/**
 * Check if the backend API is healthy
 * @returns {Promise<{status: string, timestamp: string, version: string}>}
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('Backend API is not available')
  }

  return response.json()
}

export default {
  uploadImage,
  uploadMetadata,
  uploadTemplateImage,
  uploadTemplateMetadata,
  healthCheck,
}
