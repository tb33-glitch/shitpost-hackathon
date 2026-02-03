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

// ==================== Community Templates API ====================

/**
 * Get all community templates from the database
 * @returns {Promise<{success: boolean, templates: Array, count: number}>}
 */
export async function getCommunityTemplatesFromAPI() {
  const response = await fetch(`${API_BASE_URL}/templates`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch templates' }))
    throw new Error(error.error || `Failed to fetch templates (${response.status})`)
  }

  return response.json()
}

/**
 * Submit a new community template to the database
 * @param {object} template - Template data to submit
 * @returns {Promise<{success: boolean, template: object}>}
 */
export async function submitCommunityTemplate(template) {
  const response = await fetch(`${API_BASE_URL}/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: template.name,
      image_url: template.imageUrl,
      image_cid: template.imageCid,
      category: template.category || 'templates',
      tags: template.tags || [],
      submitted_by: template.submittedBy,
      display_name: template.displayName,
      source_url: template.sourceUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to submit template' }))
    throw new Error(error.error || `Failed to submit template (${response.status})`)
  }

  return response.json()
}

/**
 * Get XP leaderboard from the database
 * @returns {Promise<{success: boolean, leaderboard: Array}>}
 */
export async function getTemplateLeaderboard() {
  const response = await fetch(`${API_BASE_URL}/templates/leaderboard`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch leaderboard' }))
    throw new Error(error.error || `Failed to fetch leaderboard (${response.status})`)
  }

  return response.json()
}

/**
 * Delete a template (admin only)
 * @param {string} id - Template ID to delete
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteTemplate(id) {
  const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete template' }))
    throw new Error(error.error || `Failed to delete template (${response.status})`)
  }

  return response.json()
}

/**
 * Batch delete templates
 * @param {Array<string>} ids - Template IDs to delete
 * @returns {Promise<{success: boolean, deleted: number, failed: number}>}
 */
export async function deleteTemplatesBatch(ids) {
  const response = await fetch(`${API_BASE_URL}/templates/delete-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete templates' }))
    throw new Error(error.error || `Failed to delete templates (${response.status})`)
  }

  return response.json()
}

/**
 * Import a template from external URL (downloads to Supabase Storage)
 * @param {object} template - Template data to import
 * @returns {Promise<{success: boolean, template: object}>}
 */
export async function importTemplate(template) {
  const response = await fetch(`${API_BASE_URL}/templates/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: template.name,
      source_url: template.sourceUrl,
      category: template.category || 'templates',
      tags: template.tags || [],
      submitted_by: template.submittedBy,
      display_name: template.displayName,
      is_curated: template.isCurated || false,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Import failed' }))
    throw new Error(error.error || error.message || `Failed to import template (${response.status})`)
  }

  return response.json()
}

/**
 * Batch import multiple templates from external URLs
 * @param {Array} templates - Array of template objects with name and sourceUrl
 * @param {object} options - Additional options (submittedBy, displayName, isCurated)
 * @returns {Promise<{success: boolean, imported: number, failed: number, results: Array}>}
 */
export async function importTemplatesBatch(templates, options = {}) {
  const response = await fetch(`${API_BASE_URL}/templates/import-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templates: templates.map(t => ({
        name: t.name,
        source_url: t.sourceUrl,
        category: t.category || 'templates',
        tags: t.tags || [],
      })),
      submitted_by: options.submittedBy,
      display_name: options.displayName,
      is_curated: options.isCurated || false,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Batch import failed' }))
    throw new Error(error.error || error.message || `Failed to import templates (${response.status})`)
  }

  return response.json()
}

/**
 * Update a template's metadata (name, category, tags)
 * @param {string} id - Template ID to update
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, template: object}>}
 */
export async function updateTemplate(id, updates) {
  const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update template' }))
    throw new Error(error.error || `Failed to update template (${response.status})`)
  }

  return response.json()
}

/**
 * Get a proxied URL for media files (videos/images from Supabase)
 * Note: Supabase Storage has CORS enabled by default, so we don't need to proxy those URLs.
 * Only external non-Supabase URLs would need proxying.
 * @param {string} url - Original media URL
 * @returns {string} Original URL (Supabase has CORS enabled)
 */
export function getProxiedMediaUrl(url) {
  // Supabase Storage URLs have CORS enabled, no need to proxy
  // Just return the original URL
  return url
}

/**
 * Check if a URL is from Supabase storage
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isSupabaseUrl(url) {
  return url && url.includes('.supabase.co/')
}

export default {
  uploadImage,
  uploadMetadata,
  uploadTemplateImage,
  uploadTemplateMetadata,
  healthCheck,
  getCommunityTemplatesFromAPI,
  submitCommunityTemplate,
  getTemplateLeaderboard,
  deleteTemplate,
  deleteTemplatesBatch,
  importTemplate,
  importTemplatesBatch,
  updateTemplate,
  getProxiedMediaUrl,
  isSupabaseUrl,
}
