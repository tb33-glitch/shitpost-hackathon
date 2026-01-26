/**
 * Template Registry - Manages community-submitted templates via IPFS
 *
 * Storage Architecture:
 * - Each template image is uploaded to IPFS
 * - Each template has metadata JSON uploaded to IPFS
 * - A master registry JSON tracks all submissions (stored in localStorage + IPFS)
 * - Registry is periodically synced to IPFS for persistence
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
const REGISTRY_KEY = 'shitpost-template-registry'
const REGISTRY_CID_KEY = 'shitpost-registry-cid'

// Check if Pinata is properly configured
const isPinataConfigured = PINATA_JWT && PINATA_JWT !== 'your_pinata_jwt_here'

// ==================== IPFS Upload Functions ====================

/**
 * Upload a template image to IPFS via Pinata, or save locally if not configured
 */
export async function uploadTemplateImage(file, templateName) {
  // If Pinata isn't configured, save as data URL in localStorage
  if (!isPinataConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        resolve({
          cid: localId,
          url: reader.result, // data URL
          gateway: reader.result,
          isLocal: true,
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const formData = new FormData()
  const sanitizedName = templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const extension = file.name.split('.').pop() || 'png'
  const filename = `template-${sanitizedName}-${Date.now()}.${extension}`

  formData.append('file', file, filename)

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload image: ${error}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

/**
 * Upload template metadata JSON to IPFS via Pinata, or save locally if not configured
 */
export async function uploadTemplateMetadata(metadata) {
  // If Pinata isn't configured, just return a local ID
  if (!isPinataConfigured) {
    const localId = `local-meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return {
      cid: localId,
      url: `local://${localId}`,
      gateway: `local://${localId}`,
      isLocal: true,
    }
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `shitpost-template-${metadata.name}`,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload metadata: ${error}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

// ==================== Registry Management ====================

/**
 * Get the current registry from localStorage
 */
export function getLocalRegistry() {
  try {
    const stored = localStorage.getItem(REGISTRY_KEY)
    console.log('[Registry] getLocalRegistry - found:', stored ? JSON.parse(stored).templates?.length + ' templates' : 'empty')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to parse local registry:', e)
  }

  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    templates: [],
  }
}

/**
 * Save the registry to localStorage
 */
export function saveLocalRegistry(registry) {
  try {
    const data = JSON.stringify(registry)
    localStorage.setItem(REGISTRY_KEY, data)
    console.log('[Registry] Saved registry with', registry.templates?.length || 0, 'templates')
    // Verify it was saved
    const verify = localStorage.getItem(REGISTRY_KEY)
    console.log('[Registry] Verification:', verify ? 'saved successfully' : 'SAVE FAILED')
  } catch (e) {
    console.error('Failed to save registry:', e)
  }
}

/**
 * Add a new template to the registry
 */
export async function addToRegistry(entry) {
  const registry = getLocalRegistry()

  // Add the new entry
  registry.templates.push(entry)
  registry.lastUpdated = new Date().toISOString()

  // Save locally
  saveLocalRegistry(registry)

  // Also upload the updated registry to IPFS for persistence (if configured)
  if (isPinataConfigured) {
    try {
      const registryCid = await uploadRegistryToIPFS(registry)
      localStorage.setItem(REGISTRY_CID_KEY, registryCid)
    } catch (e) {
      console.error('Failed to sync registry to IPFS:', e)
      // Continue anyway - local storage is the primary source
    }
  }

  return registry
}

/**
 * Upload the full registry to IPFS
 */
async function uploadRegistryToIPFS(registry) {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured')
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: registry,
      pinataMetadata: {
        name: 'shitpost-template-registry',
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload registry: ${error}`)
  }

  const data = await response.json()
  return data.IpfsHash
}

/**
 * Fetch registry from IPFS and merge with local
 */
export async function syncRegistryFromIPFS() {
  const registryCid = localStorage.getItem(REGISTRY_CID_KEY)
  if (!registryCid) {
    return getLocalRegistry()
  }

  try {
    const response = await fetch(`https://${PINATA_GATEWAY}/ipfs/${registryCid}`)
    if (!response.ok) {
      throw new Error('Failed to fetch registry')
    }

    const remoteRegistry = await response.json()
    const localRegistry = getLocalRegistry()

    // Merge registries (combine templates, dedupe by CID)
    const allTemplates = [...localRegistry.templates, ...remoteRegistry.templates]
    const uniqueTemplates = allTemplates.reduce((acc, template) => {
      if (!acc.find(t => t.cid === template.cid)) {
        acc.push(template)
      }
      return acc
    }, [])

    const mergedRegistry = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      templates: uniqueTemplates,
    }

    saveLocalRegistry(mergedRegistry)
    return mergedRegistry
  } catch (e) {
    console.error('Failed to sync from IPFS:', e)
    return getLocalRegistry()
  }
}

// ==================== Community Templates Loading ====================

/**
 * Get all community templates in a format compatible with the template picker
 */
export async function getCommunityTemplates() {
  // First try to sync with IPFS
  await syncRegistryFromIPFS()

  const registry = getLocalRegistry()

  // Convert registry entries to template format
  return registry.templates.map((entry, index) => ({
    id: `community-${entry.cid}-${index}`,
    name: entry.name,
    category: entry.category === 'templates' ? 'community' : entry.category,
    // Handle both IPFS and local data URLs
    image: entry.imageUrl || (entry.imageCid?.startsWith('local-') ? entry.imageCid : `https://${PINATA_GATEWAY}/ipfs/${entry.imageCid}`),
    aspectRatio: 1,
    textZones: getDefaultTextZones(entry.category),
    tags: entry.tags || [],
    isCustom: true,
    isCommunity: true,
    submittedBy: entry.submittedBy,
    displayName: entry.displayName,
    xp: entry.xp,
    submittedAt: entry.submittedAt,
    cid: entry.cid,
  }))
}

/**
 * Get default text zones based on category
 */
function getDefaultTextZones(category) {
  switch (category) {
    case 'stickers':
      return [] // Stickers don't have text zones
    case 'backgrounds':
      return [
        { id: 'center', x: 50, y: 50, width: 90, height: 50, defaultText: '', fontSize: 32, align: 'center' },
      ]
    case 'templates':
    default:
      return [
        { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
        { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
      ]
  }
}

// ==================== Leaderboard Functions ====================

/**
 * Calculate XP leaderboard from registry
 */
export function getLeaderboard() {
  const registry = getLocalRegistry()

  // Aggregate XP by wallet address
  const xpByWallet = {}

  registry.templates.forEach(template => {
    const wallet = template.submittedBy
    if (!xpByWallet[wallet]) {
      xpByWallet[wallet] = {
        address: wallet,
        displayName: template.displayName,
        xp: 0,
        templateCount: 0,
      }
    }
    xpByWallet[wallet].xp += template.xp || 10
    xpByWallet[wallet].templateCount += 1
    // Update display name if newer template has one
    if (template.displayName) {
      xpByWallet[wallet].displayName = template.displayName
    }
  })

  // Convert to array and sort by XP
  return Object.values(xpByWallet)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 20) // Top 20
}

/**
 * Get XP for a specific wallet
 */
export function getWalletXP(walletAddress) {
  const registry = getLocalRegistry()

  const walletTemplates = registry.templates.filter(
    t => t.submittedBy?.toLowerCase() === walletAddress?.toLowerCase()
  )

  return {
    xp: walletTemplates.reduce((sum, t) => sum + (t.xp || 10), 0),
    templateCount: walletTemplates.length,
  }
}

// ==================== Utility Functions ====================

/**
 * Convert IPFS URL to gateway URL
 */
export function ipfsToGateway(ipfsUrl) {
  if (!ipfsUrl) return ''
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`)
  }
  return ipfsUrl
}

/**
 * Remove a template from the registry (admin function)
 */
export function removeFromRegistry(cid) {
  const registry = getLocalRegistry()
  registry.templates = registry.templates.filter(t => t.cid !== cid)
  registry.lastUpdated = new Date().toISOString()
  saveLocalRegistry(registry)
  return registry
}

/**
 * Clear the entire registry (admin function)
 */
export function clearRegistry() {
  console.log('[Registry] CLEARING REGISTRY - called from:', new Error().stack)
  localStorage.removeItem(REGISTRY_KEY)
  localStorage.removeItem(REGISTRY_CID_KEY)
}

export default {
  uploadTemplateImage,
  uploadTemplateMetadata,
  getLocalRegistry,
  saveLocalRegistry,
  addToRegistry,
  syncRegistryFromIPFS,
  getCommunityTemplates,
  getLeaderboard,
  getWalletXP,
  ipfsToGateway,
  removeFromRegistry,
  clearRegistry,
}
