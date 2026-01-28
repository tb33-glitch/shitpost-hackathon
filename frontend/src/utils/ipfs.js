/**
 * IPFS utilities for Pinata uploads
 * Now uses secure backend API - JWT is never exposed to browser
 */

import * as api from './api.js'

const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

// Upload image blob to IPFS via backend
export async function uploadImage(blob, filename = 'artwork.png') {
  return api.uploadImage(blob, filename)
}

// Upload metadata JSON to IPFS via backend
export async function uploadMetadata(metadata) {
  // Sanitize metadata before sending to backend
  const sanitizedMetadata = {
    name: String(metadata.name || '').slice(0, 100),
    description: String(metadata.description || '').slice(0, 500),
    image: metadata.image,
    external_url: metadata.external_url,
    attributes: Array.isArray(metadata.attributes) ? metadata.attributes.slice(0, 20) : [],
  }

  return api.uploadMetadata(sanitizedMetadata)
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

// Check if backend API is configured and healthy
export async function isBackendAvailable() {
  try {
    await api.healthCheck()
    return true
  } catch {
    return false
  }
}
